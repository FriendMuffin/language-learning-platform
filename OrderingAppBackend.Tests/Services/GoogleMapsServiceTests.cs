// OrderingAppBackend.Tests/Services/GoogleMapsServiceTests.cs
using System;
using System.Net;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Moq.Protected;
using Newtonsoft.Json.Linq;
using OrderingAppBackend.Services;
using OrderingAppBackend.Settings;
using Xunit;

namespace OrderingAppBackend.Tests.Services
{
    public class GoogleMapsServiceTests
    {
        private readonly Mock<IOptions<GoogleMapsSettings>> _mockOptions;
        private readonly Mock<ILogger<GoogleMapsService>> _mockLogger;
        private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
        private readonly HttpClient _httpClient;

        public GoogleMapsServiceTests()
        {
            _mockOptions = new Mock<IOptions<GoogleMapsSettings>>();
            _mockOptions.Setup(opt => opt.Value).Returns(new GoogleMapsSettings
            {
                ApiKey = "test-api-key",
                BaseUrl = "https://maps.googleapis.com/maps/api/distancematrix/json",
                TimeoutSeconds = 10,
                Unit = "metric"
            });

            _mockLogger = new Mock<ILogger<GoogleMapsService>>();
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            _httpClient = new HttpClient(_mockHttpMessageHandler.Object);
        }

        [Fact]
        public async Task CalculateDistanceAsync_WithValidAddresses_ReturnsDistance()
        {
            // Arrange
            var origin = "Berlin, Germany";
            var destination = "Munich, Germany";
            
            // Setup mock response
            var jsonResponse = @"{
                ""status"": ""OK"",
                ""origin_addresses"": [""Berlin, Germany""],
                ""destination_addresses"": [""Munich, Germany""],
                ""rows"": [{
                    ""elements"": [{
                        ""status"": ""OK"",
                        ""duration"": {
                            ""value"": 22000,
                            ""text"": ""6 hours 7 mins""
                        },
                        ""distance"": {
                            ""value"": 584000,
                            ""text"": ""584 km""
                        }
                    }]
                }]
            }";

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(jsonResponse)
                });

            var service = new GoogleMapsService(_httpClient, _mockOptions.Object, _mockLogger.Object);

            // Act
            var distance = await service.CalculateDistanceAsync(origin, destination);

            // Assert
            Assert.Equal(584000, distance);
        }

        [Fact]
        public async Task CalculateDistanceAsync_WithApiError_ThrowsException()
        {
            // Arrange
            var origin = "Berlin, Germany";
            var destination = "Munich, Germany";
            
            // Setup mock response with error
            var jsonResponse = @"{
                ""status"": ""INVALID_REQUEST"",
                ""error_message"": ""Invalid request. Missing or invalid parameters."",
                ""rows"": [{
                    ""elements"": [{
                        ""status"": ""NOT_FOUND"",
                        ""error_message"": ""Element-specific error""
                    }]
                }]
            }";

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK, // API kann 200 OK zurückgeben, aber mit einem Fehlerstatus im JSON
                    Content = new StringContent(jsonResponse)
                });

            var service = new GoogleMapsService(_httpClient, _mockOptions.Object, _mockLogger.Object);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => 
                service.CalculateDistanceAsync(origin, destination));
            
            Assert.Contains("Route calculation error", exception.Message);
        }

        [Fact]
        public async Task CalculateDistanceAsync_WithMissingDistance_ThrowsException()
        {
            // Arrange
            var origin = "Berlin, Germany";
            var destination = "Munich, Germany";
            
            // Setup mock response without distance data
            var jsonResponse = @"{
                ""status"": ""OK"",
                ""origin_addresses"": [""Berlin, Germany""],
                ""destination_addresses"": [""Munich, Germany""],
                ""rows"": [{
                    ""elements"": [{
                        ""status"": ""OK"",
                        ""duration"": {
                            ""value"": 22000,
                            ""text"": ""6 hours 7 mins""
                        }
                        /* Missing distance object */
                    }]
                }]
            }";

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(jsonResponse)
                });

            var service = new GoogleMapsService(_httpClient, _mockOptions.Object, _mockLogger.Object);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => 
                service.CalculateDistanceAsync(origin, destination));
            
            Assert.Contains("Distance information not available", exception.Message);
        }

        [Fact]
        public async Task CalculateDistanceAsync_WithHttpError_ThrowsException()
        {
            // Arrange
            var origin = "Berlin, Germany";
            var destination = "Munich, Germany";
            
            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.InternalServerError,
                    Content = new StringContent("Internal server error")
                });

            var service = new GoogleMapsService(_httpClient, _mockOptions.Object, _mockLogger.Object);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(() => 
                service.CalculateDistanceAsync(origin, destination));
            
            Assert.Contains("Failed to connect to Google Maps API", exception.Message);
        }

        [Fact]
        public async Task CalculateDistanceAsync_WithTimeout_ThrowsTimeoutException()
        {
            // Arrange
            var origin = "Berlin, Germany";
            var destination = "Munich, Germany";
            
            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ThrowsAsync(new TaskCanceledException());

            var service = new GoogleMapsService(_httpClient, _mockOptions.Object, _mockLogger.Object);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<TimeoutException>(() => 
                service.CalculateDistanceAsync(origin, destination));
            
            Assert.Contains("timed out", exception.Message);
        }

        [Theory]
        [InlineData(null, "Munich, Germany")]
        [InlineData("Berlin, Germany", null)]
        public async Task CalculateDistanceAsync_WithNullParameters_ThrowsArgumentNullException(string origin, string destination)
        {
            // Arrange
            var service = new GoogleMapsService(_httpClient, _mockOptions.Object, _mockLogger.Object);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => 
                service.CalculateDistanceAsync(origin, destination));
        }

        [Theory]
        [InlineData("", "Munich, Germany")]
        [InlineData("Berlin, Germany", "")]
        public async Task CalculateDistanceAsync_WithEmptyParameters_ThrowsArgumentException(string origin, string destination)
        {
            // Arrange
            var service = new GoogleMapsService(_httpClient, _mockOptions.Object, _mockLogger.Object);

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => 
                service.CalculateDistanceAsync(origin, destination));
        }
    }
}