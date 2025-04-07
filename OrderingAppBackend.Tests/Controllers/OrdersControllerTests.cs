using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using OrderingAppBackend.Controllers;
using OrderingAppBackend.Models;
using OrderingAppBackend.Data;
using OrderingAppBackend.Services.Authentication;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using Xunit;
using Microsoft.AspNetCore.Http;
using OrderingAppBackend.Hubs;
using Microsoft.AspNetCore.SignalR;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace OrderingAppBackend.Tests.Controllers
{
    public class OrdersControllerTests
    {
        private readonly Mock<AppDbContext> _mockContext;
        private readonly Mock<IJwtTokenService> _mockTokenService;
        private readonly Mock<IHubContext<OrderHub>> _mockHubContext;
        private readonly Mock<ILogger<OrdersController>> _mockLogger;
        private readonly OrdersController _controller;
        private readonly Mock<DbSet<Order>> _mockOrderDbSet;

        public OrdersControllerTests()
        {
            // Setup mocks
            _mockContext = new Mock<AppDbContext>(new DbContextOptions<AppDbContext>());
            _mockTokenService = new Mock<IJwtTokenService>();
            _mockHubContext = new Mock<IHubContext<OrderHub>>();
            _mockLogger = new Mock<ILogger<OrdersController>>();
            
            // Setup order dbset mock
            _mockOrderDbSet = new Mock<DbSet<Order>>();
            _mockContext.Setup(c => c.Orders).Returns(_mockOrderDbSet.Object);

            _controller = new OrdersController(
                _mockContext.Object,
                _mockTokenService.Object,
                _mockHubContext.Object,
                _mockLogger.Object);
            
            // Setup default user claims
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Customer")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
        }

        [Fact]
        public void GetOrder_WithValidId_ReturnsOkResult()
        {
            // Arrange
            var orderId = 1;
            var order = new Order { Id = orderId, UserId = 1 };
            
            _mockOrderDbSet.Setup(m => m.Find(orderId)).Returns(order);

            // Act
            var result = _controller.GetOrder(orderId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedOrder = Assert.IsType<Order>(okResult.Value);
            Assert.Equal(orderId, returnedOrder.Id);
        }

        [Fact]
        public void GetOrder_WithInvalidId_ReturnsNotFound()
        {
            // Arrange
            var orderId = 999;
            _mockOrderDbSet.Setup(m => m.Find(orderId)).Returns((Order)null);

            // Act
            var result = _controller.GetOrder(orderId);

            // Assert
            Assert.IsType<NotFoundResult>(result);
        }

        [Fact]
        public void GetOrder_WithUnauthorizedAccess_ReturnsForbidden()
        {
            // Arrange
            var orderId = 1;
            var order = new Order { Id = orderId, UserId = 2 }; // Belongs to different user
            _mockOrderDbSet.Setup(m => m.Find(orderId)).Returns(order);

            // Act
            var result = _controller.GetOrder(orderId);

            // Assert
            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public void GetMyOrders_ReturnsOkWithOrders()
        {
            // Arrange
            var userId = 1;
            var orders = new List<Order> { new Order { Id = 1, UserId = userId } }.AsQueryable();
            
            // Setup mock for IQueryable
            _mockOrderDbSet.As<IQueryable<Order>>().Setup(m => m.Provider).Returns(orders.Provider);
            _mockOrderDbSet.As<IQueryable<Order>>().Setup(m => m.Expression).Returns(orders.Expression);
            _mockOrderDbSet.As<IQueryable<Order>>().Setup(m => m.ElementType).Returns(orders.ElementType);
            _mockOrderDbSet.As<IQueryable<Order>>().Setup(m => m.GetEnumerator()).Returns(orders.GetEnumerator());

            // Act
            var result = _controller.GetMyOrders();

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedOrders = Assert.IsType<List<Order>>(okResult.Value);
            Assert.Single(returnedOrders);
        }

        [Fact]
        public void PlaceOrder_WithValidData_ReturnsCreatedResult()
        {
            // Arrange
            var userId = 1;
            var request = new PlaceOrderRequest
            {
                DeliveryAddress = "Test Address",
                Items = new List<OrderItemRequest>
                {
                    new OrderItemRequest { ProductId = 1, Quantity = 2 }
                }
            };
            
            var createdOrder = new Order 
            { 
                Id = 1, 
                UserId = userId,
                DeliveryAddress = request.DeliveryAddress,
                Status = OrderStatus.Pending
            };
            
            // Setup for DbContext SaveChanges and Add methods
            _mockContext.Setup(c => c.Add(It.IsAny<Order>())).Verifiable();
            _mockContext.Setup(c => c.SaveChanges()).Returns(1);
            
            // Act
            var result = _controller.PlaceOrder(request);
            
            // Assert
            var createdResult = Assert.IsType<CreatedAtActionResult>(result);
            Assert.Equal("GetOrder", createdResult.ActionName);
        }
        
        [Fact]
        public void PlaceOrder_WithMissingAddress_ReturnsBadRequest()
        {
            // Arrange
            var request = new PlaceOrderRequest
            {
                // Missing address
                Items = new List<OrderItemRequest>
                {
                    new OrderItemRequest { ProductId = 1, Quantity = 2 }
                }
            };
            
            _controller.ModelState.AddModelError("DeliveryAddress", "Required");
            
            // Act
            var result = _controller.PlaceOrder(request);
            
            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }
        
        [Fact]
        public void PlaceOrder_WithEmptyItems_ReturnsBadRequest()
        {
            // Arrange
            var request = new PlaceOrderRequest
            {
                DeliveryAddress = "Test Address",
                Items = new List<OrderItemRequest>() // Empty items
            };
            
            _controller.ModelState.AddModelError("Items", "At least one item is required");
            
            // Act
            var result = _controller.PlaceOrder(request);
            
            // Assert
            Assert.IsType<BadRequestObjectResult>(result);
        }
        
        [Fact]
        public void UpdateOrderStatus_AsDeliverer_WithValidStatus_ReturnsOkResult()
        {
            // Arrange - Setup Deliverer role
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Deliverer")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
            
            var orderId = 1;
            var newStatus = OrderStatus.OnTheWay;
            var request = new UpdateStatusRequest { Status = newStatus };
            var order = new Order { Id = orderId, Status = OrderStatus.Confirmed, DelivererId = 1 };
            
            _mockOrderDbSet.Setup(m => m.Find(orderId)).Returns(order);
            _mockContext.Setup(c => c.SaveChanges()).Returns(1);
            
            // Act
            var result = _controller.UpdateOrderStatus(orderId, request);
            
            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedOrder = Assert.IsType<Order>(okResult.Value);
            Assert.Equal(newStatus, returnedOrder.Status);
        }
        
        [Fact]
        public void UpdateOrderStatus_WithInvalidOrder_ReturnsNotFound()
        {
            // Arrange
            var orderId = 999;
            var request = new UpdateStatusRequest { Status = OrderStatus.Confirmed };
            
            _mockOrderDbSet.Setup(m => m.Find(orderId)).Returns((Order)null);
            
            // Act
            var result = _controller.UpdateOrderStatus(orderId, request);
            
            // Assert
            Assert.IsType<NotFoundResult>(result);
        }
        
        [Fact]
        public void UpdateOrderStatus_ByUnauthorizedUser_ReturnsForbidden()
        {
            // Arrange
            var orderId = 1;
            var request = new UpdateStatusRequest { Status = OrderStatus.Confirmed };
            var order = new Order { Id = orderId, Status = OrderStatus.Pending, DelivererId = 2 }; // Different deliverer
            
            _mockOrderDbSet.Setup(m => m.Find(orderId)).Returns(order);
            
            // Setup Deliverer role
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Deliverer")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
            
            // Act
            var result = _controller.UpdateOrderStatus(orderId, request);
            
            // Assert
            Assert.IsType<ForbidResult>(result);
        }
        
        [Fact]
        public void GetAllOrders_AsAdmin_ReturnsAllOrders()
        {
            // Arrange - Setup Admin role
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, "1"),
                new Claim(ClaimTypes.Role, "Admin")
            };
            var identity = new ClaimsIdentity(claims, "TestAuthType");
            var claimsPrincipal = new ClaimsPrincipal(identity);

            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = claimsPrincipal }
            };
            
            var orders = new List<Order> 
            { 
                new Order { Id = 1, UserId = 1 },
                new Order { Id = 2, UserId = 2 }
            }.AsQueryable();
            
            // Setup mock for IQueryable
            _mockOrderDbSet.As<IQueryable<Order>>().Setup(m => m.Provider).Returns(orders.Provider);
            _mockOrderDbSet.As<IQueryable<Order>>().Setup(m => m.Expression).Returns(orders.Expression);
            _mockOrderDbSet.As<IQueryable<Order>>().Setup(m => m.ElementType).Returns(orders.ElementType);
            _mockOrderDbSet.As<IQueryable<Order>>().Setup(m => m.GetEnumerator()).Returns(orders.GetEnumerator());
            
            // Act
            var result = _controller.GetAllOrders();
            
            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var returnedOrders = Assert.IsType<List<Order>>(okResult.Value);
            Assert.Equal(2, returnedOrders.Count);
        }
        
        [Fact]
        public void GetAllOrders_AsNonAdmin_ReturnsForbidden()
        {
            // Already setup with Customer role in constructor
            
            // Act
            var result = _controller.GetAllOrders();
            
            // Assert
            Assert.IsType<ForbidResult>(result);
        }
    }
}