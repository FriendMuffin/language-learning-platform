// OrderingAppBackend.Tests/Repositories/UserRepositoryTests.cs
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
    public class UserRepositoryTests : RepositoryTestBase<User, IRepository<User>>, IDisposable
    {
        protected override IRepository<User> CreateRepository()
        {
            return new Repository<User>(
                _context,
                _dataAccessFilterMock.Object,
                _resiliencePolicyMock.Object);
        }
        
        [Fact]
        public async Task GetByIdAsync_ExistingUser_ReturnsUser()
        {
            // Arrange
            var user = new User
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
            
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            
            // Act
            var result = await _repository.GetByIdAsync(user.Id);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(user.Id, result.Id);
            Assert.Equal("test@example.com", result.Email);
        }
        
        [Fact]
        public async Task GetByIdAsync_NonExistingUser_ReturnsNull()
        {
            // Act
            var result = await _repository.GetByIdAsync(999);
            
            // Assert
            Assert.Null(result);
        }
        
        [Fact]
        public async Task AddAsync_ValidUser_SavesToDatabase()
        {
            // Arrange
            var user = new User
            {
                Email = "new@example.com",
                PasswordHash = "hashedpassword",
                Salt = "salt",
                Role = "User",
                IsActive = true,
                DisplayName = "New User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            // Act
            await _repository.AddAsync(user);
            await _context.SaveChangesAsync();
            
            // Assert
            var savedUser = await _context.Users.FindAsync(user.Id);
            Assert.NotNull(savedUser);
            Assert.Equal("new@example.com", savedUser.Email);
            Assert.Equal("New User", savedUser.DisplayName);
        }
        
        [Fact]
        public async Task UpdateAsync_ExistingUser_UpdatesInDatabase()
        {
            // Arrange
            var user = new User
            {
                Email = "update@example.com",
                PasswordHash = "hashedpassword",
                Salt = "salt",
                Role = "User",
                IsActive = true,
                DisplayName = "Initial User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            
            // Detach the entity
            _context.Entry(user).State = EntityState.Detached;
            
            // Update the user
            user.DisplayName = "Updated User";
            user.Email = "updated@example.com";
            
            // Act
            await _repository.UpdateAsync(user);
            await _context.SaveChangesAsync();
            
            // Assert
            var updatedUser = await _context.Users.FindAsync(user.Id);
            Assert.NotNull(updatedUser);
            Assert.Equal("Updated User", updatedUser.DisplayName);
            Assert.Equal("updated@example.com", updatedUser.Email);
        }
        
        [Fact]
        public async Task SoftDeleteAsync_ExistingUser_MarksAsDeleted()
        {
            // Arrange
            var user = new User
            {
                Email = "delete@example.com",
                PasswordHash = "hashedpassword",
                Salt = "salt",
                Role = "User",
                IsActive = true,
                DisplayName = "Delete User",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _context.Users.AddAsync(user);
            await _context.SaveChangesAsync();
            
            // Act
            await _repository.SoftDeleteAsync(user);
            await _context.SaveChangesAsync();
            
            // Assert
            var deletedUser = await _context.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Id == user.Id);
                
            Assert.NotNull(deletedUser);
            Assert.True(deletedUser.IsDeleted);
            Assert.NotNull(deletedUser.DeletedAt);
        }
    }
}