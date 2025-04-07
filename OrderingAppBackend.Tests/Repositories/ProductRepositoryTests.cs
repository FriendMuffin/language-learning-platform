// OrderingAppBackend.Tests/Repositories/ProductRepositoryTests.cs
using System;
using System.Linq;
using System.Threading.Tasks;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Moq;
using OrderingAppBackend.Models;
using OrderingAppBackend.Repositories.Base;
using OrderingAppBackend.Tests.Helpers;
using Xunit;

namespace OrderingAppBackend.Tests.Repositories
{
    public class ProductRepositoryTests : RepositoryTestBase<Product, IRepository<Product>>, IDisposable
    {
        protected override IRepository<Product> CreateRepository()
        {
            return new Repository<Product>(
                _context,
                _dataAccessFilterMock.Object,
                _resiliencePolicyMock.Object);
        }
        
        [Fact]
        public async Task GetByIdAsync_ExistingProduct_ReturnsProduct()
        {
            // Arrange
            var product = new Product
            {
                Name = "Test Product",
                Description = "Description",
                Price = 9.99m,
                Category = "Test",
                IsAvailable = true,
                StockQuantity = 10,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            
            // Act
            var result = await _repository.GetByIdAsync(product.Id);
            
            // Assert
            Assert.NotNull(result);
            Assert.Equal(product.Id, result.Id);
            Assert.Equal("Test Product", result.Name);
        }
        
        [Fact]
        public async Task GetByIdAsync_NonExistingProduct_ReturnsNull()
        {
            // Act
            var result = await _repository.GetByIdAsync(999);
            
            // Assert
            Assert.Null(result);
        }
        
        [Fact]
        public async Task AddAsync_ValidProduct_SavesToDatabase()
        {
            // Arrange
            var product = new Product
            {
                Name = "New Product",
                Description = "Description",
                Price = 19.99m,
                Category = "Test",
                IsAvailable = true,
                StockQuantity = 5,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            // Act
            await _repository.AddAsync(product);
            await _context.SaveChangesAsync();
            
            // Assert
            var savedProduct = await _context.Products.FindAsync(product.Id);
            Assert.NotNull(savedProduct);
            Assert.Equal("New Product", savedProduct.Name);
            Assert.Equal(19.99m, savedProduct.Price);
        }
        
        [Fact]
        public async Task UpdateAsync_ExistingProduct_UpdatesInDatabase()
        {
            // Arrange
            var product = new Product
            {
                Name = "Initial Product",
                Description = "Initial Description",
                Price = 9.99m,
                Category = "Test",
                IsAvailable = true,
                StockQuantity = 10,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            
            // Detach the entity
            _context.Entry(product).State = EntityState.Detached;
            
            // Update the product
            product.Name = "Updated Product";
            product.Price = 14.99m;
            
            // Act
            await _repository.UpdateAsync(product);
            await _context.SaveChangesAsync();
            
            // Assert
            var updatedProduct = await _context.Products.FindAsync(product.Id);
            Assert.NotNull(updatedProduct);
            Assert.Equal("Updated Product", updatedProduct.Name);
            Assert.Equal(14.99m, updatedProduct.Price);
        }
        
        [Fact]
        public async Task SoftDeleteAsync_ExistingProduct_MarksAsDeleted()
        {
            // Arrange
            var product = new Product
            {
                Name = "Product to Delete",
                Description = "Description",
                Price = 9.99m,
                Category = "Test",
                IsAvailable = true,
                StockQuantity = 10,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            
            // Act
            await _repository.SoftDeleteAsync(product);
            await _context.SaveChangesAsync();
            
            // Assert
            var deletedProduct = await _context.Products
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(p => p.Id == product.Id);
                
            Assert.NotNull(deletedProduct);
            Assert.True(deletedProduct.IsDeleted);
            Assert.NotNull(deletedProduct.DeletedAt);
        }
    }
}