// OrderingAppBackend.Tests/Integration/IntegrationTestBase.cs
using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using OrderingAppBackend.Data;
using OrderingAppBackend.Repositories.Base;
using OrderingAppBackend.Security;
using OrderingAppBackend.Services.Caching;
using OrderingAppBackend.Services.Resilience;
using OrderingAppBackend.Tests.Helpers;
using Xunit;

namespace OrderingAppBackend.Tests.Integration
{
    public abstract class IntegrationTestBase : IDisposable
    {
        protected readonly IServiceProvider _serviceProvider;
        protected readonly AppDbContext _dbContext;
        protected readonly IUnitOfWork _unitOfWork;
        
        protected IntegrationTestBase()
        {
            // Create a new service collection
            var services = new ServiceCollection();
            
            // Add database
            _dbContext = TestDbContextFactory.CreateInMemoryDbContext();
            services.AddSingleton(_dbContext);
            
            // Add mocks
            services.AddSingleton(new Mock<IDataAccessFilter>().Object);
            services.AddSingleton(new Mock<ICacheService>().Object);
            
            // Setup resilience policy to just execute the function
            var resiliencePolicyMock = new Mock<IDatabaseResiliencePolicy>();
            resiliencePolicyMock
                .Setup(x => x.ExecuteAsync(It.IsAny<Func<Task<object>>>()))
                .Returns((Func<Task<object>> func) => func());
            resiliencePolicyMock
                .Setup(x => x.ExecuteAsync(It.IsAny<Func<Task>>()))
                .Returns((Func<Task> func) => func());
            services.AddSingleton(resiliencePolicyMock.Object);
            
            // Add services
            services.AddScoped<IUnitOfWork, UnitOfWork>();
            
            // Add your services here
            ConfigureServices(services);
            
            // Build the service provider
            _serviceProvider = services.BuildServiceProvider();
            
            // Get the unit of work
            _unitOfWork = _serviceProvider.GetRequiredService<IUnitOfWork>();
            
            // Setup the database
            SeedDatabase();
        }
        
        protected virtual void ConfigureServices(IServiceCollection services)
        {
            // Override in derived classes to add service registrations
        }
        
        protected virtual void SeedDatabase()
        {
            // Override in derived classes to seed the database
        }
        
        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }
    }
}