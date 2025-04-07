// OrderingAppBackend.Tests/Repositories/DelivererRepositoryTests.cs - Updated Status values
using System;
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
    public class DelivererRepositoryTests : RepositoryTestBase<Deliverer, IRepository<Deliverer>>, IDisposable
    {
        private User _testUser;
        
        public DelivererRepositoryTests()
        {
            // Setup test user
            _testUser = new User
            {
                Email = "deliverer-test@example.com",
                PasswordHash = "hashedpassword",
                Salt = "salt",
                Role = "Deliverer",
                IsActive = true,
                DisplayName = "Deliverer Test User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _context.Users.Add(_testUser);
            _context.SaveChanges();
        }
        
        protected override IRepository<Deliverer> CreateRepository()
        {
            return new Repository<Deliverer>(
                _context,
                _dataAccessFilterMock.Object,
                _resiliencePolicyMock.Object);
        }
        
        [Fact]
        public async Task GetByIdAsync_ExistingDeliverer_ReturnsDeliverer()
        {
            // Arrange
            var deliverer = new Deliverer
            {
                Name = "Test Deliverer",
                Email = "deliverer@example.com",
                PhoneNumber = "1234567890",
                Location = "Test Location",
                Latitude = 40.7128,
                Longitude = -74.0060,
                Status = DelivererStatus.Available,
                UserId = _testUser.Id,
                Rating = 4.5,
                DeliveryCount = 0,
                MaxConcurrentDeliveries = 3,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _context.Deliverers.AddAsync(deliverer);
            await _context.SaveChangesAsync();
            
            // Act
            var result = await _repository.GetByIdAsync(deliverer.Id);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(deliverer.Id, result.Id);
            Assert.Equal("Test Deliverer", result.Name);
            Assert.Equal(_testUser.Id, result.UserId);
        }
        
        [Fact]
        public async Task GetByIdAsync_NonExistingDeliverer_ReturnsNull()
        {
            // Act
            var result = await _repository.GetByIdAsync(999);
            
            // Assert
            Assert.Null(result);
        }
        
        [Fact]
        public async Task AddAsync_ValidDeliverer_SavesToDatabase()
        {
            // Arrange
            var deliverer = new Deliverer
            {
                Name = "New Deliverer",
                Email = "new.deliverer@example.com",
                PhoneNumber = "9876543210",
                Location = "New Location",
                Latitude = 34.0522,
                Longitude = -118.2437,
                Status = DelivererStatus.Available,
                UserId = _testUser.Id,
                Rating = 5.0,
                DeliveryCount = 0,
                MaxConcurrentDeliveries = 5,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            // Act
            await _repository.AddAsync(deliverer);
            await _context.SaveChangesAsync();
            
            // Assert
            var savedDeliverer = await _context.Deliverers.FindAsync(deliverer.Id);
            Assert.NotNull(savedDeliverer);
            Assert.Equal("New Deliverer", savedDeliverer.Name);
            Assert.Equal(34.0522, savedDeliverer.Latitude);
            Assert.Equal(-118.2437, savedDeliverer.Longitude);
        }
        
        [Fact]
        public async Task UpdateAsync_ExistingDeliverer_UpdatesInDatabase()
        {
            // Arrange
            var deliverer = new Deliverer
            {
                Name = "Update Deliverer",
                Email = "update.deliverer@example.com",
                PhoneNumber = "1122334455",
                Location = "Initial Location",
                Latitude = 51.5074,
                Longitude = -0.1278,
                Status = DelivererStatus.Available,
                UserId = _testUser.Id,
                Rating = 4.0,
                DeliveryCount = 0,
                MaxConcurrentDeliveries = 2,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _context.Deliverers.AddAsync(deliverer);
            await _context.SaveChangesAsync();
            
            // Detach the entity
            _context.Entry(deliverer).State = EntityState.Detached;
            
            // Update the deliverer
            deliverer.Name = "Updated Deliverer";
            deliverer.Location = "Updated Location";
            deliverer.Status = DelivererStatus.Delivering;  // Updated to use correct enum value
            
            // Act
            await _repository.UpdateAsync(deliverer);
            await _context.SaveChangesAsync();
            
            // Assert
            var updatedDeliverer = await _context.Deliverers.FindAsync(deliverer.Id);
            Assert.NotNull(updatedDeliverer);
            Assert.Equal("Updated Deliverer", updatedDeliverer.Name);
            Assert.Equal("Updated Location", updatedDeliverer.Location);
            Assert.Equal(DelivererStatus.Delivering, updatedDeliverer.Status);  // Updated to use correct enum value
        }
        
        [Fact]
        public async Task SoftDeleteAsync_ExistingDeliverer_MarksAsDeleted()
        {
            // Arrange
            var deliverer = new Deliverer
            {
                Name = "Delete Deliverer",
                Email = "delete.deliverer@example.com",
                PhoneNumber = "5566778899",
                Location = "Delete Location",
                Latitude = 48.8566,
                Longitude = 2.3522,
                Status = DelivererStatus.Available,
                UserId = _testUser.Id,
                Rating = 3.5,
                DeliveryCount = 0,
                MaxConcurrentDeliveries = 1,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _context.Deliverers.AddAsync(deliverer);
            await _context.SaveChangesAsync();
            
            // Act
            await _repository.SoftDeleteAsync(deliverer);
            await _context.SaveChangesAsync();
            
            // Assert
            var deletedDeliverer = await _context.Deliverers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(d => d.Id == deliverer.Id);
                
            Assert.NotNull(deletedDeliverer);
            Assert.True(deletedDeliverer.IsDeleted);
            Assert.NotNull(deletedDeliverer.DeletedAt);
        }
    }
}