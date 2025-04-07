// OrderingAppBackend.Tests/Services/Authentication/JwtTokenServiceTests.cs
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using OrderingAppBackend.Models;
using OrderingAppBackend.Services.Authentication;

namespace OrderingAppBackend.Tests.Services.Authentication
{
    public class JwtTokenServiceTests
    {
        private readonly Mock<IOptions<AuthSettings>> _mockOptions;
        private readonly JwtTokenService _jwtTokenService;
        private readonly User _testUser;

        public JwtTokenServiceTests()
        {
            _mockOptions = new Mock<IOptions<AuthSettings>>();
            _mockOptions.Setup(opt => opt.Value).Returns(new AuthSettings
            {
                JwtSecret = "ThisIsATestSecretKeyThatIsLongEnoughForHMACSHA256",
                JwtIssuer = "TestIssuer",
                JwtAudience = "TestAudience",
                JwtExpiryInHours = 1
            });

            _jwtTokenService = new JwtTokenService(_mockOptions.Object);

            _testUser = new User
            {
                Id = 1,
                Email = "test@example.com",
                Role = "Customer"
            };
        }

        [Fact]
        public void GenerateJwtToken_WithValidUser_ReturnsValidToken()
        {
            // Act
            var token = _jwtTokenService.GenerateJwtToken(_testUser);

            // Assert
            Assert.NotNull(token);
            Assert.NotEmpty(token);

            // Verify token format
            var parts = token.Split('.');
            Assert.Equal(3, parts.Length); // Header.Payload.Signature

            // Decode and verify token
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadToken(token) as JwtSecurityToken;

            Assert.NotNull(jsonToken);
            Assert.Equal("TestIssuer", jsonToken.Issuer);
            Assert.Equal("TestAudience", jsonToken.Audiences.First());
            
            // Verify claims
            Assert.Contains(jsonToken.Claims, claim => claim.Type == "nameid" && claim.Value == "1");
            Assert.Contains(jsonToken.Claims, claim => claim.Type == "email" && claim.Value == "test@example.com");
            Assert.Contains(jsonToken.Claims, claim => claim.Type == "role" && claim.Value == "Customer");
        }

        [Fact]
        public void GenerateJwtToken_WithAdditionalClaims_IncludesTheClaims()
        {
            // Arrange
            var additionalClaims = new List<Claim>
            {
                new Claim("custom", "value"),
                new Claim("test", "test-value")
            };

            // Act
            var token = _jwtTokenService.GenerateJwtToken(_testUser, additionalClaims);

            // Assert
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadToken(token) as JwtSecurityToken;

            Assert.NotNull(jsonToken);
            Assert.Contains(jsonToken.Claims, claim => claim.Type == "custom" && claim.Value == "value");
            Assert.Contains(jsonToken.Claims, claim => claim.Type == "test" && claim.Value == "test-value");
            
            // Standard claims should still be present
            Assert.Contains(jsonToken.Claims, claim => claim.Type == "nameid" && claim.Value == "1");
        }

        [Fact]
        public void GenerateJwtToken_WithNullUser_ThrowsArgumentNullException()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => _jwtTokenService.GenerateJwtToken(null));
        }

        [Fact]
        public void GenerateJwtToken_SetsCorrectExpiration()
        {
            // Arrange
            _mockOptions.Setup(opt => opt.Value).Returns(new AuthSettings
            {
                JwtSecret = "ThisIsATestSecretKeyThatIsLongEnoughForHMACSHA256",
                JwtIssuer = "TestIssuer",
                JwtAudience = "TestAudience",
                JwtExpiryInHours = 2 // 2 hours
            });

            var service = new JwtTokenService(_mockOptions.Object);

            // Act
            var token = service.GenerateJwtToken(_testUser);

            // Assert
            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadToken(token) as JwtSecurityToken;

            Assert.NotNull(jsonToken);
            
            // Expiration should be roughly 2 hours from now
            var expectedExpiration = DateTime.UtcNow.AddHours(2);
            var actualExpiration = jsonToken.ValidTo;
            
            // Allow for a small time difference due to test execution time
            var timeDiff = Math.Abs((expectedExpiration - actualExpiration).TotalMinutes);
            Assert.True(timeDiff < 1); // Less than 1 minute difference
        }
    }
}