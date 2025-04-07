// OrderingAppBackend.Tests/Integration/OrderServiceIntegrationTests.cs
using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OrderingAppBackend.Models;
using OrderingAppBackend.Services;
using Xunit;

namespace OrderingAppBackend.Tests.Integration
{
    public class OrderServiceIntegrationTests : IntegrationTestBase
    {
        private readonly IOrderService _orderService;
        private User _testUser;
        private Product _testProduct;
        
        public OrderServiceIntegrationTests()
        {
            _orderService = _serviceProvider.GetRequiredService<IOrderService>();
        }
        
        protected override void ConfigureServices(IServiceCollection services)
        {
            // Register the order service
            services.AddScoped<IOrderService, OrderService>();
            
            // Register any dependencies the order service needs
            // Add other required services...
        }
        
        protected override void SeedDatabase()
        {
            // Create test user
            _testUser = new User
            {
                Email = "test@example.com",
                PasswordHash = "hashedpassword",
                Salt = "salt",
                Role = "User",
                IsActive = true,
                DisplayName = "Test User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _dbContext.Users.Add(_testUser);
            
            // Create test product
            _testProduct = new Product
            {
                Name = "Test Product",
                Description = "Test Description",
                Price = 9.99m,
                Category = "Test",
                IsAvailable = true,
                StockQuantity = 100,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _dbContext.Products.Add(_testProduct);
            _dbContext.SaveChanges();
        }
        
        [Fact]
        public void PlaceOrder_ValidOrder_ReturnsCreatedOrder()
        {
            // Arrange
            var order = new Order
            {
                UserId = _testUser.Id,
                DeliveryAddress = "123 Test St",
                CurrentLocation = "Current Location",
                ContactPhone = "1234567890",
                SpecialInstructions = "Test instructions",
                Status = OrderStatus.Pending,
                TotalAmount = 19.98m,
                OrderItems = new List<OrderItem>
                {
                    new OrderItem
                    {
                        ProductId = _testProduct.Id,
                        Quantity = 2,
                        UnitPrice = 9.99m
                    }
                }
            };
            
            // Act
            var result = _orderService.PlaceOrder(order);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(_testUser.Id, result.UserId);
            Assert.Equal("123 Test St", result.DeliveryAddress);
            Assert.Equal(OrderStatus.Pending, result.Status);
            Assert.Single(result.OrderItems);
            Assert.Equal(_testProduct.Id, result.OrderItems.First().ProductId);
            Assert.Equal(2, result.OrderItems.First().Quantity);
            
            // Verify in database
            var savedOrder = _dbContext.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefault(o => o.Id == result.Id);
                
            Assert.NotNull(savedOrder);
            Assert.Equal(_testUser.Id, savedOrder.UserId);
            Assert.Equal("123 Test St", savedOrder.DeliveryAddress);
            Assert.Equal(OrderStatus.Pending, savedOrder.Status);
            Assert.Single(savedOrder.OrderItems);
        }
        
        [Fact]
        public void GetOrder_ExistingOrder_ReturnsOrder()
        {
            // Arrange
            var order = new Order
            {
                UserId = _testUser.Id,
                DeliveryAddress = "456 Test St",
                CurrentLocation = "Test Location",
                Status = OrderStatus.Pending,
                ContactPhone = "0987654321",
                TotalAmount = 19.98m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                OrderItems = new List<OrderItem>
                {
                    new OrderItem
                    {
                        ProductId = _testProduct.Id,
                        Quantity = 2,
                        UnitPrice = 9.99m
                    }
                }
            };
            
            _dbContext.Orders.Add(order);
            _dbContext.SaveChanges();
            
            // Act
            var result = _orderService.GetOrder(order.Id);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(order.Id, result.Id);
            Assert.Equal(_testUser.Id, result.UserId);
            Assert.Equal("456 Test St", result.DeliveryAddress);
        }
        
        [Fact]
        public void GetAllOrders_MultipleOrders_ReturnsAllOrders()
        {
            // Arrange
            var order1 = new Order
            {
                UserId = _testUser.Id,
                DeliveryAddress = "Order 1 Address",
                CurrentLocation = "Location 1",
                Status = OrderStatus.Pending,
                TotalAmount = 9.99m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            var order2 = new Order
            {
                UserId = _testUser.Id,
                DeliveryAddress = "Order 2 Address",
                CurrentLocation = "Location 2",
                Status = OrderStatus.Pending,
                TotalAmount = 19.98m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _dbContext.Orders.AddRange(order1, order2);
            _dbContext.SaveChanges();
            
            // Act
            var results = _orderService.GetAllOrders();
            
            // Assert
            Assert.NotNull(results);
            Assert.Equal(2, results.Count());
            Assert.Contains(results, o => o.DeliveryAddress == "Order 1 Address");
            Assert.Contains(results, o => o.DeliveryAddress == "Order 2 Address");
        }
        
        [Fact]
        public void UpdateOrderStatus_ExistingOrder_UpdatesStatus()
        {
            // Arrange
            var order = new Order
            {
                UserId = _testUser.Id,
                DeliveryAddress = "789 Test St",
                CurrentLocation = "Status Test Location",
                Status = OrderStatus.Pending,
                ContactPhone = "1122334455",
                TotalAmount = 9.99m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                OrderItems = new List<OrderItem>
                {
                    new OrderItem
                    {
                        ProductId = _testProduct.Id,
                        Quantity = 1,
                        UnitPrice = 9.99m
                    }
                }
            };
            
            _dbContext.Orders.Add(order);
            _dbContext.SaveChanges();
            
            // Act
            var result = _orderService.UpdateOrderStatus(order.Id, OrderStatus.Confirmed);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(OrderStatus.Confirmed, result.Status);
            Assert.NotNull(result.ConfirmedAt);
            
            // Verify in database
            var updatedOrder = _dbContext.Orders.Find(order.Id);
            Assert.NotNull(updatedOrder);
            Assert.Equal(OrderStatus.Confirmed, updatedOrder.Status);
            Assert.NotNull(updatedOrder.ConfirmedAt);
        }
    }
}