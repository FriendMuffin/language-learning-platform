// OrderingAppBackend.PerformanceTests/ComprehensivePerformanceTest.cs
using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using Microsoft.Extensions.Configuration;
using Npgsql;
using Xunit;
using Xunit.Abstractions;

namespace OrderingAppBackend.PerformanceTests
{
    public class ComprehensivePerformanceTest
    {
        private readonly ITestOutputHelper _output;
        private readonly string _connectionString;
        private readonly List<PerformanceResult> _results = new();
        
        public class PerformanceResult
        {
            public string QueryName { get; set; }
            public string QueryType { get; set; }
            public string Sql { get; set; }
            public int RowCount { get; set; }
            public long ExecutionTimeMs { get; set; }
            public long AverageTimePerRow { get; set; }
        }
        
        public ComprehensivePerformanceTest(ITestOutputHelper output)
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
        }
        
        [Fact]
        public void RunComprehensivePerformanceTests()
        {
            _output.WriteLine("Starting comprehensive performance tests");
            
            try
            {
                using var connection = new NpgsqlConnection(_connectionString);
                connection.Open();
                
                _output.WriteLine("Database connection established");
                
                // Basic queries
                MeasureQueryPerformance(connection, "Count Users", "Simple Count", 
                    "SELECT COUNT(*) FROM \"Users\" WHERE \"IsDeleted\" = false");
                
                MeasureQueryPerformance(connection, "Get All Products", "Simple Select", 
                    "SELECT * FROM \"Products\" WHERE \"IsDeleted\" = false");
                    
                // Filtering
                MeasureQueryPerformance(connection, "Filter Products by Category", "Indexed Filter", 
                    "SELECT * FROM \"Products\" WHERE \"Category\" = 'Electronics' AND \"IsDeleted\" = false");
                    
                MeasureQueryPerformance(connection, "Filter Products by Price", "Range Filter", 
                    "SELECT * FROM \"Products\" WHERE \"Price\" > 10 AND \"IsDeleted\" = false");
                    
                // Joins
                MeasureQueryPerformance(connection, "Orders with User Info", "Simple Join", 
                    @"SELECT o.*, u.""DisplayName"" FROM ""Orders"" o
                      JOIN ""Users"" u ON o.""UserId"" = u.""Id""
                      WHERE o.""IsDeleted"" = false AND u.""IsDeleted"" = false
                      LIMIT 100");
                      
                MeasureQueryPerformance(connection, "Orders with Items and Products", "Multiple Join", 
                    @"SELECT o.*, oi.*, p.""Name"" FROM ""Orders"" o
                      JOIN ""OrderItems"" oi ON o.""Id"" = oi.""OrderId""
                      JOIN ""Products"" p ON oi.""ProductId"" = p.""Id""
                      WHERE o.""IsDeleted"" = false AND p.""IsDeleted"" = false
                      LIMIT 100");
                      
                // Aggregations
                MeasureQueryPerformance(connection, "Orders by Status", "Group By", 
                    @"SELECT ""Status"", COUNT(*) as Count 
                      FROM ""Orders"" 
                      WHERE ""IsDeleted"" = false
                      GROUP BY ""Status""");
                      
                MeasureQueryPerformance(connection, "Revenue by Product", "Complex Aggregation", 
                    @"SELECT p.""Id"", p.""Name"", SUM(oi.""Quantity"" * oi.""UnitPrice"") as Revenue
                      FROM ""Products"" p
                      JOIN ""OrderItems"" oi ON p.""Id"" = oi.""ProductId""
                      JOIN ""Orders"" o ON oi.""OrderId"" = o.""Id""
                      WHERE p.""IsDeleted"" = false AND o.""IsDeleted"" = false
                      GROUP BY p.""Id"", p.""Name""
                      ORDER BY Revenue DESC
                      LIMIT 10");
                
                // Generate report
                GeneratePerformanceReport();
            }
            catch (Exception ex)
            {
                _output.WriteLine($"Error: {ex.Message}");
                _output.WriteLine($"Stack trace: {ex.StackTrace}");
            }
        }
        
        private void MeasureQueryPerformance(NpgsqlConnection connection, string queryName, string queryType, string sql)
        {
            try
            {
                _output.WriteLine($"Running: {queryName}");
                
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
                
                var result = new PerformanceResult
                {
                    QueryName = queryName,
                    QueryType = queryType,
                    Sql = sql,
                    RowCount = rowCount,
                    ExecutionTimeMs = stopwatch.ElapsedMilliseconds,
                    AverageTimePerRow = rowCount > 0 ? stopwatch.ElapsedMilliseconds / rowCount : 0
                };
                
                _results.Add(result);
                
                _output.WriteLine($"  Result: {rowCount} rows, {stopwatch.ElapsedMilliseconds}ms");
            }
            catch (Exception ex)
            {
                _output.WriteLine($"  Error executing '{queryName}': {ex.Message}");
                
                // Still add to results as a failed query
                _results.Add(new PerformanceResult
                {
                    QueryName = queryName,
                    QueryType = queryType,
                    Sql = sql,
                    RowCount = -1,
                    ExecutionTimeMs = -1,
                    AverageTimePerRow = -1
                });
            }
        }
        
        private void GeneratePerformanceReport()
        {
            var sb = new StringBuilder();
            
            sb.AppendLine("# Database Performance Report");
            sb.AppendLine($"Generated at: {DateTime.Now:yyyy-MM-dd HH:mm:ss}");
            sb.AppendLine();
            
            sb.AppendLine("## Summary");
            sb.AppendLine();
            sb.AppendLine("| Query Type | Average Execution Time (ms) | Query Count |");
            sb.AppendLine("|------------|------------------------------|------------|");
            
            var byType = _results.GroupBy(r => r.QueryType)
                .Select(g => new 
                {
                    Type = g.Key,
                    AvgTime = g.Average(r => r.ExecutionTimeMs),
                    Count = g.Count()
                })
                .OrderByDescending(x => x.AvgTime);
                
            foreach (var group in byType)
            {
                sb.AppendLine($"| {group.Type} | {group.AvgTime:F2} | {group.Count} |");
            }
            
            sb.AppendLine();
            sb.AppendLine("## Detailed Results");
            sb.AppendLine();
            sb.AppendLine("| Query | Type | Rows | Time (ms) | Time per Row (ms) |");
            sb.AppendLine("|-------|------|------|-----------|-------------------|");
            
            foreach (var result in _results.OrderByDescending(r => r.ExecutionTimeMs))
            {
                // Only include successful queries
                if (result.ExecutionTimeMs > 0)
                {
                    sb.AppendLine($"| {result.QueryName} | {result.QueryType} | {result.RowCount} | {result.ExecutionTimeMs} | {result.AverageTimePerRow} |");
                }
            }
            
            sb.AppendLine();
            sb.AppendLine("## Recommendations");
            sb.AppendLine();
            
            // Find slow queries
            var slowQueries = _results.Where(r => r.ExecutionTimeMs > 100).OrderByDescending(r => r.ExecutionTimeMs).ToList();
            
            if (slowQueries.Any())
            {
                sb.AppendLine("### Slow Queries");
                sb.AppendLine();
                sb.AppendLine("The following queries took more than 100ms to execute:");
                sb.AppendLine();
                
                foreach (var query in slowQueries)
                {
                    sb.AppendLine($"- **{query.QueryName}** ({query.ExecutionTimeMs}ms)");
                    sb.AppendLine("  - Consider adding indexes for frequently filtered or joined columns");
                    sb.AppendLine("  - Review query plan with EXPLAIN ANALYZE");
                }
            }
            else
            {
                sb.AppendLine("All queries executed in less than 100ms, which is good performance!");
            }
            
            // Output the report
            _output.WriteLine(sb.ToString());
            
            // Save to file
            try
            {
                File.WriteAllText("PerformanceReport.md", sb.ToString());
                _output.WriteLine("Performance report saved to PerformanceReport.md");
            }
            catch (Exception ex)
            {
                _output.WriteLine($"Error saving report: {ex.Message}");
            }
        }
    }
}