using Microsoft.Extensions.Logging;
using Moq;
using OrderingAppBackend.Models;
using OrderingAppBackend.Repositories;
using OrderingAppBackend.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace OrderingAppBackend.Tests.Services
{
    public class OrderServiceTests
    {
        private readonly Mock<IOrderRepository> _mockOrderRepository;
        private readonly Mock<ILogger<OrderService>> _mockLogger;
        private readonly OrderService _orderService;

        public OrderServiceTests()
        {
            _mockOrderRepository = new Mock<IOrderRepository>();
            _mockLogger = new Mock<ILogger<OrderService>>();
            _orderService = new OrderService(_mockOrderRepository.Object);
        }

        [Fact]
        public void Constructor_NullRepository_ThrowsArgumentNullException()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => new OrderService(null));
        }

        [Fact]
        public void GetOrder_ValidId_ReturnsOrder()
        {
            // Arrange
            var orderId = 1;
            var expectedOrder = new Order { Id = orderId, UserId = 1 };
            _mockOrderRepository.Setup(repo => repo.GetOrder(orderId)).Returns(expectedOrder);

            // Act
            var result = _orderService.GetOrder(orderId);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(orderId, result.Id);
            _mockOrderRepository.Verify(repo => repo.GetOrder(orderId), Times.Once);
        }

        [Fact]
        public void GetOrder_InvalidId_ThrowsArgumentException()
        {
            // Arrange
            var invalidId = 0;

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => _orderService.GetOrder(invalidId));
            Assert.Contains("Order ID must be greater than zero", exception.Message);
        }

        [Fact]
        public void GetOrder_NonExistingId_ThrowsKeyNotFoundException()
        {
            // Arrange
            var nonExistingId = 999;
            _mockOrderRepository.Setup(repo => repo.GetOrder(nonExistingId)).Returns((Order)null);

            // Act & Assert
            var exception = Assert.Throws<KeyNotFoundException>(() => _orderService.GetOrder(nonExistingId));
            Assert.Contains($"Order with ID {nonExistingId} not found", exception.Message);
        }

        [Fact]
        public void PlaceOrder_ValidOrder_ReturnsCreatedOrder()
        {
            // Arrange
            var newOrder = new Order 
            { 
                UserId = 1,
                DeliveryAddress = "Test Address",
                CurrentLocation = "Test Location"
            };
            
            var createdOrder = new Order 
            { 
                Id = 1,
                UserId = 1,
                DeliveryAddress = "Test Address",
                CurrentLocation = "Test Location",
                Status = OrderStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };
            
            _mockOrderRepository.Setup(repo => repo.AddOrder(It.IsAny<Order>())).Returns(createdOrder);

            // Act
            var result = _orderService.PlaceOrder(newOrder);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(1, result.Id);
            Assert.Equal(OrderStatus.Pending, result.Status);
            Assert.NotEqual(default, result.CreatedAt);
            _mockOrderRepository.Verify(repo => repo.AddOrder(It.IsAny<Order>()), Times.Once);
        }

        [Fact]
        public void PlaceOrder_NullOrder_ThrowsArgumentNullException()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => _orderService.PlaceOrder(null));
        }

        [Fact]
        public void PlaceOrder_OrderWithId_ThrowsArgumentException()
        {
            // Arrange
            var orderWithId = new Order { Id = 1, UserId = 1 };

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => _orderService.PlaceOrder(orderWithId));
            Assert.Contains("New orders should not have an ID assigned", exception.Message);
        }

        [Fact]
        public void PlaceOrder_OrderWithoutUserId_ThrowsArgumentException()
        {
            // Arrange
            var orderWithoutUserId = new Order { DeliveryAddress = "Test Address" };

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => _orderService.PlaceOrder(orderWithoutUserId));
            Assert.Contains("UserId is required", exception.Message);
        }

        [Fact]
        public void GetAllOrders_ReturnsAllOrders()
        {
            // Arrange
            var orders = new List<Order>
            {
                new Order { Id = 1, UserId = 1 },
                new Order { Id = 2, UserId = 2 }
            };
            
            _mockOrderRepository.Setup(repo => repo.GetOrders()).Returns(orders);

            // Act
            var result = _orderService.GetAllOrders();

            // Assert
            Assert.NotNull(result);
            Assert.Equal(2, result.Count());
            _mockOrderRepository.Verify(repo => repo.GetOrders(), Times.Once);
        }

        [Fact]
        public void UpdateOrderStatus_ValidIdAndStatus_ReturnsUpdatedOrder()
        {
            // Arrange
            var orderId = 1;
            var existingOrder = new Order 
            { 
                Id = orderId, 
                UserId = 1, 
                Status = OrderStatus.Pending,
                UpdatedAt = DateTime.UtcNow.AddDays(-1) // Set to yesterday
            };
            
            _mockOrderRepository.Setup(repo => repo.GetOrder(orderId)).Returns(existingOrder);

            // Act
            var result = _orderService.UpdateOrderStatus(orderId, OrderStatus.Confirmed);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(OrderStatus.Confirmed, result.Status);
            
            // Verify UpdatedAt was changed
            Assert.True(result.UpdatedAt > existingOrder.UpdatedAt);
            
            // Note: The current implementation doesn't actually save the changes to the repository,
            // so we can't verify that UpdateOrder was called
        }

        [Fact]
        public void UpdateOrderStatus_InvalidId_ThrowsArgumentException()
        {
            // Arrange
            var invalidId = 0;

            // Act & Assert
            var exception = Assert.Throws<ArgumentException>(() => 
                _orderService.UpdateOrderStatus(invalidId, OrderStatus.Confirmed));
            Assert.Contains("Order ID must be greater than zero", exception.Message);
        }
        
        [Fact]
        public void UpdateOrderStatus_NonExistingId_ThrowsKeyNotFoundException()
        {
            // Arrange
            var nonExistingId = 999;
            _mockOrderRepository.Setup(repo => repo.GetOrder(nonExistingId)).Returns((Order)null);

            // Act & Assert
            var exception = Assert.Throws<KeyNotFoundException>(() => 
                _orderService.UpdateOrderStatus(nonExistingId, OrderStatus.Confirmed));
            Assert.Contains($"Order with ID {nonExistingId} not found", exception.Message);
        }
        
        [Theory]
        [InlineData(OrderStatus.Pending, OrderStatus.Confirmed)]
        [InlineData(OrderStatus.Confirmed, OrderStatus.InProgress)]
        [InlineData(OrderStatus.InProgress, OrderStatus.OnTheWay)]
        [InlineData(OrderStatus.OnTheWay, OrderStatus.Delivered)]
        [InlineData(OrderStatus.Pending, OrderStatus.Cancelled)]
        public void UpdateOrderStatus_ValidStatusTransitions_UpdatesStatus(OrderStatus initialStatus, OrderStatus newStatus)
        {
            // Arrange
            var orderId = 1;
            var existingOrder = new Order 
            { 
                Id = orderId, 
                UserId = 1, 
                Status = initialStatus
            };
            
            _mockOrderRepository.Setup(repo => repo.GetOrder(orderId)).Returns(existingOrder);

            // Act
            var result = _orderService.UpdateOrderStatus(orderId, newStatus);

            // Assert
            Assert.Equal(newStatus, result.Status);
        }
    }
}