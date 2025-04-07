// OrderingAppBackend.Tests/Repositories/OrderRepositoryTests.cs
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using OrderingAppBackend.Models;
using OrderingAppBackend.Repositories.Base;
using OrderingAppBackend.Tests.Helpers;
using Xunit;

namespace OrderingAppBackend.Tests.Repositories
{
    public class OrderRepositoryTests : RepositoryTestBase<Order, IRepository<Order>>, IDisposable
    {
        private User _testUser;
        
        public OrderRepositoryTests()
        {
            // Setup test user
            _testUser = new User
            {
                Email = "order-test@example.com",
                PasswordHash = "hashedpassword",
                Salt = "salt",
                Role = "User",
                IsActive = true,
                DisplayName = "Order Test User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _context.Users.Add(_testUser);
            _context.SaveChanges();
        }
        
        protected override IRepository<Order> CreateRepository()
        {
            return new Repository<Order>(
                _context,
                _dataAccessFilterMock.Object,
                _resiliencePolicyMock.Object);
        }
        
        [Fact]
        public async Task GetByIdAsync_ExistingOrder_ReturnsOrder()
        {
            // Arrange
            var order = new Order
            {
                UserId = _testUser.Id,
                DeliveryAddress = "123 Test St",
                CurrentLocation = "Current Location",
                Status = OrderStatus.Pending,
                ContactPhone = "1234567890",
                TotalAmount = 29.99m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync();
            
            // Act
            var result = await _repository.GetByIdAsync(order.Id);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(order.Id, result.Id);
            Assert.Equal("123 Test St", result.DeliveryAddress);
            Assert.Equal(29.99m, result.TotalAmount);
        }
        
        [Fact]
        public async Task GetByIdAsync_NonExistingOrder_ReturnsNull()
        {
            // Act
            var result = await _repository.GetByIdAsync(999);
            
            // Assert
            Assert.Null(result);
        }
        
        [Fact]
        public async Task AddAsync_ValidOrder_SavesToDatabase()
        {
            // Arrange
            var order = new Order
            {
                UserId = _testUser.Id,
                DeliveryAddress = "456 New St",
                CurrentLocation = "New Location",
                Status = OrderStatus.Pending,
                ContactPhone = "0987654321",
                TotalAmount = 49.99m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                OrderItems = new List<OrderItem>
                {
                    new OrderItem
                    {
                        ProductId = 1, // Note: In a real test, you'd create a product first
                        Quantity = 2,
                        UnitPrice = 24.99m
                    }
                }
            };
            
            // Act
            await _repository.AddAsync(order);
            await _context.SaveChangesAsync();
            
            // Assert
            var savedOrder = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == order.Id);
                
            Assert.NotNull(savedOrder);
            Assert.Equal("456 New St", savedOrder.DeliveryAddress);
            Assert.Equal(49.99m, savedOrder.TotalAmount);
            Assert.Single(savedOrder.OrderItems);
        }
        
        [Fact]
        public async Task UpdateAsync_ExistingOrder_UpdatesInDatabase()
        {
            // Arrange
            var order = new Order
            {
                UserId = _testUser.Id,
                DeliveryAddress = "789 Initial St",
                CurrentLocation = "Initial Location",
                Status = OrderStatus.Pending,
                ContactPhone = "1122334455",
                TotalAmount = 39.99m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync();
            
            // Detach the entity
            _context.Entry(order).State = EntityState.Detached;
            
            // Update the order
            order.DeliveryAddress = "789 Updated St";
            order.Status = OrderStatus.Confirmed;
            order.ConfirmedAt = DateTime.UtcNow;
            
            // Act
            await _repository.UpdateAsync(order);
            await _context.SaveChangesAsync();
            
            // Assert
            var updatedOrder = await _context.Orders.FindAsync(order.Id);
            Assert.NotNull(updatedOrder);
            Assert.Equal("789 Updated St", updatedOrder.DeliveryAddress);
            Assert.Equal(OrderStatus.Confirmed, updatedOrder.Status);
            Assert.NotNull(updatedOrder.ConfirmedAt);
        }
        
        [Fact]
        public async Task SoftDeleteAsync_ExistingOrder_MarksAsDeleted()
        {
            // Arrange
            var order = new Order
            {
                UserId = _testUser.Id,
                DeliveryAddress = "321 Delete St",
                CurrentLocation = "Delete Location",
                Status = OrderStatus.Pending,
                ContactPhone = "5566778899",
                TotalAmount = 19.99m,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _context.Orders.AddAsync(order);
            await _context.SaveChangesAsync();
            
            // Act
            await _repository.SoftDeleteAsync(order);
            await _context.SaveChangesAsync();
            
            // Assert
            var deletedOrder = await _context.Orders
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(o => o.Id == order.Id);
                
            Assert.NotNull(deletedOrder);
            Assert.True(deletedOrder.IsDeleted);
            Assert.NotNull(deletedOrder.DeletedAt);
        }
    }
}