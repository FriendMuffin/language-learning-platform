// OrderingAppBackend.PerformanceTests/DatabasePerformanceTests.cs
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using OrderingAppBackend.Data;
using OrderingAppBackend.Models;
using OrderingAppBackend.Repositories.Base;
using Xunit;
using Xunit.Abstractions;

namespace OrderingAppBackend.PerformanceTests
{
    public class DatabasePerformanceTests
    {
        private readonly ITestOutputHelper _output;
        private readonly ServiceProvider _serviceProvider;
        
        public DatabasePerformanceTests(ITestOutputHelper output)
        {
            _output = output;
            
            // Set up services for testing
            var services = new ServiceCollection();
            
            // Add database context with real connection (use test database!)
            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(
                    "Host=localhost;Database=orderingapp_perftest;Username=postgres;Password=postgres"));
                    
            // Add necessary services
            services.AddLogging();
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            // Add other necessary dependencies
            
            _serviceProvider = services.BuildServiceProvider();
        }
        
        [Fact]
        public async Task MeasureDatabaseQueryPerformance()
        {
            // Arrange
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();
            
            // Warm up the connection
            await dbContext.Users.FirstOrDefaultAsync();
            
            // Act
            var stopwatch = Stopwatch.StartNew();
            
            // Test common query patterns
            await MeasureQuery("Get All Products", async () => 
                await dbContext.Products.Take(100).ToListAsync());
                
            await MeasureQuery("Get Orders By User", async () => 
                await dbContext.Orders.Where(o => o.UserId == 1).Take(50).ToListAsync());
                
            await MeasureQuery("Get Orders With Items", async () => 
                await dbContext.Orders
                    .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                    .Take(20)
                    .ToListAsync());
                    
            // Test repository pattern performance
            var productsRepo = unitOfWork.Repository<Product>();
            await MeasureQuery("Repository: Get All Products", async () => 
                await productsRepo.GetAllAsync());
                
            var ordersRepo = unitOfWork.Repository<Order>();
            await MeasureQuery("Repository: Get Orders With Paging", async () => 
                await ordersRepo.GetPagedAsync(1, 20));
            
            stopwatch.Stop();
            _output.WriteLine($"Total execution time: {stopwatch.ElapsedMilliseconds}ms");
        }
        
        private async Task MeasureQuery<T>(string queryName, Func<Task<T>> queryFunc)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = await queryFunc();
            stopwatch.Stop();
            
            _output.WriteLine($"{queryName}: {stopwatch.ElapsedMilliseconds}ms");
            
            // For collections, also output the count
            if (result is IEnumerable<object> collection)
            {
                _output.WriteLine($"  - Result count: {collection.Count()}");
            }
        }
    }
}