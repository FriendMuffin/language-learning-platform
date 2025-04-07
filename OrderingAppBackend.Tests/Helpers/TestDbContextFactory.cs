// OrderingAppBackend.Tests/Helpers/TestDbContextFactory.cs
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using OrderingAppBackend.Data;

namespace OrderingAppBackend.Tests.Helpers
{
    public class TestDbContextFactory
    {
        /// <summary>
        /// Creates a new in-memory database context for testing
        /// </summary>
        public static AppDbContext CreateInMemoryDbContext(string dbName = null)
        {
            dbName ??= Guid.NewGuid().ToString();
            
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: dbName)
                .Options;
                
            var logger = NullLoggerFactory.Instance.CreateLogger<AppDbContext>();
            return new AppDbContext(options, logger);
        }
        
        /// <summary>
        /// Creates a new PostgreSQL database context for integration testing
        /// </summary>
        public static AppDbContext CreateTestPostgresDbContext()
        {
            // Connection string for test database - should be in test configuration
            string connectionString = "Host=localhost;Database=orderingapp_test;Username=postgres;Password=postgres";
            
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(connectionString)
                .Options;
                
            var logger = NullLoggerFactory.Instance.CreateLogger<AppDbContext>();
            var context = new AppDbContext(options, logger);
            
            return context;
        }
    }
}