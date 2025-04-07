using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Newtonsoft.Json;
using OrderingAppBackend.Controllers;
using OrderingAppBackend.Models;
using Xunit;

namespace OrderingAppBackend.Tests.Integration
{
    [Collection("Integration Tests")]
    public class OrdersControllerIntegrationTests : IDisposable
    {
        private readonly HttpClient _client;
        private readonly string _baseUrl;
        private readonly string _mockAuthToken;

        public OrdersControllerIntegrationTests()
        {
            // Konfiguration für direkte HTTP-Anfragen
            _baseUrl = "http://localhost:5092"; // Anpassen an deine lokale Entwicklungsumgebung
            _client = new HttpClient();
            
            // Mock-Token für Tests - für verschiedene Benutzerrollen
            // Customer-Token
            _mockAuthToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwibmFtZWlkIjoiMSIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsInJvbGUiOiJDdXN0b21lciIsIm5iZiI6MTYxNjc2NzQwMCwiZXhwIjoxOTMwNDAwMDAwLCJpYXQiOjE2MTY3Njc0MDAsImlzcyI6Ik9yZGVyaW5nQXBwIiwiYXVkIjoiT3JkZXJpbmdBcHBVc2VycyJ9.eH9Qcnf1AxDdecwqPDDGuYzM6y5K1k7-v0tCRSM9Pt8";
            
            // Admin-Token (für Administratortests)
            // _mockAdminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwibmFtZWlkIjoiMiIsImVtYWlsIjoiYWRtaW5AZXhhbXBsZS5jb20iLCJyb2xlIjoiQWRtaW4iLCJuYmYiOjE2MTY3Njc0MDAsImV4cCI6MTkzMDQwMDAwMCwiaWF0IjoxNjE2NzY3NDAwLCJpc3MiOiJPcmRlcmluZ0FwcCIsImF1ZCI6Ik9yZGVyaW5nQXBwVXNlcnMifQ.XYZ123";
            
            // Deliverer-Token (für Lieferantentests)
            // _mockDelivererToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzIiwibmFtZWlkIjoiMyIsImVtYWlsIjoiZGVsaXZlcmVyQGV4YW1wbGUuY29tIiwicm9sZSI6IkRlbGl2ZXJlciIsIm5iZiI6MTYxNjc2NzQwMCwiZXhwIjoxOTMwNDAwMDAwLCJpYXQiOjE2MTY3Njc0MDAsImlzcyI6Ik9yZGVyaW5nQXBwIiwiYXVkIjoiT3JkZXJpbmdBcHBVc2VycyJ9.XYZ456";
            
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _mockAuthToken);
        }

        public void Dispose()
        {
            _client.Dispose();
        }

        [Fact(Skip = "Requires running server - Enable manually for integration testing")]
        public async Task GetOrder_WithValidId_ReturnsOrder()
        {
            // Arrange
            var orderId = 1; // Ein bekannte Bestellungs-ID in deiner Testdatenbank

            // Act
            var response = await _client.GetAsync($"{_baseUrl}/api/orders/{orderId}");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();
            var order = JsonConvert.DeserializeObject<Order>(responseString);
            
            Assert.NotNull(order);
            Assert.Equal(orderId, order.Id);
        }

        [Fact(Skip = "Requires running server - Enable manually for integration testing")]
        public async Task GetOrder_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            var orderId = 99999; // Eine nicht existierende Bestellungs-ID

            // Act
            var response = await _client.GetAsync($"{_baseUrl}/api/orders/{orderId}");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact(Skip = "Requires running server - Enable manually for integration testing")]
        public async Task GetMyOrders_ReturnsUserOrders()
        {
            // Act
            var response = await _client.GetAsync($"{_baseUrl}/api/orders/my-orders");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseString = await response.Content.ReadAsStringAsync();
            var orders = JsonConvert.DeserializeObject<List<Order>>(responseString);
            
            Assert.NotNull(orders);
            // Weitere Assertionen, abhängig von deinen Testdaten
        }

        [Fact(Skip = "Requires running server - Enable manually for integration testing")]
        public async Task PlaceOrder_WithValidData_CreatesOrder()
        {
            // Arrange
            var request = new PlaceOrderRequest
            {
                DeliveryAddress = "Teststraße 123, Berlin",
                Items = new List<OrderItemRequest>
                {
                    new OrderItemRequest { ProductId = 1, Quantity = 2 }
                }
            };

            var content = new StringContent(
                JsonConvert.SerializeObject(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync($"{_baseUrl}/api/orders", content);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            var responseString = await response.Content.ReadAsStringAsync();
            var order = JsonConvert.DeserializeObject<Order>(responseString);
            
            Assert.NotNull(order);
            Assert.Equal(OrderStatus.Pending, order.Status);
            Assert.Equal("Teststraße 123, Berlin", order.DeliveryAddress);
            Assert.NotEmpty(order.OrderItems);
        }

        [Fact(Skip = "Requires running server - Enable manually for integration testing")]
        public async Task PlaceOrder_WithEmptyItems_ReturnsBadRequest()
        {
            // Arrange
            var request = new PlaceOrderRequest
            {
                DeliveryAddress = "Teststraße 123, Berlin",
                Items = new List<OrderItemRequest>() // Leere Liste
            };

            var content = new StringContent(
                JsonConvert.SerializeObject(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync($"{_baseUrl}/api/orders", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact(Skip = "Requires running server - Enable manually for integration testing")]
        public async Task PlaceOrder_WithMissingAddress_ReturnsBadRequest()
        {
            // Arrange
            var request = new PlaceOrderRequest
            {
                DeliveryAddress = "", // Leere Adresse
                Items = new List<OrderItemRequest>
                {
                    new OrderItemRequest { ProductId = 1, Quantity = 2 }
                }
            };

            var content = new StringContent(
                JsonConvert.SerializeObject(request),
                Encoding.UTF8,
                "application/json");

            // Act
            var response = await _client.PostAsync($"{_baseUrl}/api/orders", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact(Skip = "Requires running server and deliverer token - Enable manually for integration testing")]
        public async Task UpdateOrderStatus_WithValidStatus_UpdatesOrderStatus()
        {
            // Diesen Test müsstest du mit einem Lieferanten-Token durchführen
            // Hier würdest du _client.DefaultRequestHeaders.Authorization ändern
            
            // Arrange
            var orderId = 1; // Eine existierende Bestellung
            var request = new UpdateStatusRequest
            {
                Status = OrderStatus.Confirmed
            };

            var content = new StringContent(
                JsonConvert.SerializeObject(request),
                Encoding.UTF8,
                "application/json");

            // Act - Dies würde mit dem aktuellen Customer-Token fehlschlagen
            var response = await _client.PutAsync($"{_baseUrl}/api/orders/{orderId}/status", content);

            // Assert - Mit aktuellem Token würde dies Forbidden (403) zurückgeben
            // Mit einem Lieferanten-Token sollte es erfolgreich sein
            Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        }
    }

    // WebApplicationFactory-Ansatz (Alternative zum direkten HTTP-Client):
    /*
    public class OrdersControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public OrdersControllerIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
            
            // Auth-Token setzen
            _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", "dein-test-token");
        }

        // Tests wie oben, aber ohne Skip-Attribute und mit _baseUrl = ""
    }
    */
}