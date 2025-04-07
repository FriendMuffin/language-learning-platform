// OrderingAppBackend.PerformanceTests/ConnectionStringBasedPerformanceTest.cs
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.IO;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Xunit;
using Xunit.Abstractions;

namespace OrderingAppBackend.PerformanceTests
{
    public class ConnectionStringBasedPerformanceTest
    {
        private readonly ITestOutputHelper _output;
        private readonly string _connectionString;
        
        public ConnectionStringBasedPerformanceTest(ITestOutputHelper output)
        {
            _output = output;
            
            // Load connection string from appsettings.json
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile("appsettings.Development.json", optional: true)
                .AddJsonFile(Path.Combine("..", "OrderingAppBackend", "appsettings.json"), optional: true)
                .AddJsonFile(Path.Combine("..", "OrderingAppBackend", "appsettings.Development.json"), optional: true)
                .Build();
                
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? 
                "Host=localhost;Database=orderingapp_dev;Username=postgres;Password=postgres";
                
            _output.WriteLine($"Using connection string base: {_connectionString.Split(';')[0]}");
        }
        
        [Fact]
        public void MeasureDatabasePerformance()
        {
            _output.WriteLine("Starting performance test with direct ADO.NET");
            
            try
            {
                // Use ADO.NET directly to bypass EF Core issues
                using var connection = new NpgsqlConnection(_connectionString);
                connection.Open();
                
                _output.WriteLine("Database connection established");
                
                // Measure query performance
                MeasureQueryPerformance(connection, "Count Users", 
                    "SELECT COUNT(*) FROM \"Users\" WHERE \"IsDeleted\" = false");
                    
                MeasureQueryPerformance(connection, "Get Products", 
                    "SELECT * FROM \"Products\" WHERE \"IsDeleted\" = false LIMIT 10");
                    
                MeasureQueryPerformance(connection, "Filter Products", 
                    "SELECT * FROM \"Products\" WHERE \"Category\" = 'Electronics' AND \"Price\" > 10 AND \"IsDeleted\" = false");
                    
                _output.WriteLine("Performance test completed");
            }
            catch (Exception ex)
            {
                _output.WriteLine($"Error: {ex.Message}");
                _output.WriteLine("Try setting the correct connection string in appsettings.json or create a local appsettings.json file in the test project");
            }
        }
        
        private void MeasureQueryPerformance(NpgsqlConnection connection, string queryName, string sql)
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();
            
            int rowCount = 0;
            
            using var command = new NpgsqlCommand(sql, connection);
            using var reader = command.ExecuteReader();
            
            // Count rows
            while (reader.Read())
            {
                rowCount++;
            }
            
            stopwatch.Stop();
            
            _output.WriteLine($"{queryName}: {rowCount} rows, {stopwatch.ElapsedMilliseconds}ms");
        }
    }
}