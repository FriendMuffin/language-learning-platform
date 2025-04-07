// OrderingAppBackend.Tests/Repositories/RepositoryTestBase.cs
using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using OrderingAppBackend.Data;
using OrderingAppBackend.Models;
using OrderingAppBackend.Repositories.Base;
using OrderingAppBackend.Security;
using OrderingAppBackend.Services.Caching;
using OrderingAppBackend.Services.Resilience;
using OrderingAppBackend.Tests.Helpers;
using Xunit;

namespace OrderingAppBackend.Tests.Repositories
{
    public abstract class RepositoryTestBase<TEntity, TRepository> 
        where TEntity : BaseEntity, new()
        where TRepository : IRepository<TEntity>
    {
        protected readonly AppDbContext _context;
        protected readonly Mock<IDataAccessFilter> _dataAccessFilterMock;
        protected readonly Mock<ICacheService> _cacheServiceMock;
        protected readonly Mock<IDatabaseResiliencePolicy> _resiliencePolicyMock;
        protected readonly TRepository _repository;
        
        protected RepositoryTestBase()
        {
            // Create in-memory database
            _context = TestDbContextFactory.CreateInMemoryDbContext();
            
            // Create mocks
            _dataAccessFilterMock = new Mock<IDataAccessFilter>();
            _cacheServiceMock = new Mock<ICacheService>();
            _resiliencePolicyMock = new Mock<IDatabaseResiliencePolicy>();
            
            // Setup resilience policy to just execute the function
            _resiliencePolicyMock
                .Setup(x => x.ExecuteAsync(It.IsAny<Func<Task<TEntity>>>()))
                .Returns((Func<Task<TEntity>> func) => func());
                
            _resiliencePolicyMock
                .Setup(x => x.ExecuteAsync(It.IsAny<Func<Task<IEnumerable<TEntity>>>>()))
                .Returns((Func<Task<IEnumerable<TEntity>>> func) => func());
                
            _resiliencePolicyMock
                .Setup(x => x.ExecuteAsync(It.IsAny<Func<Task>>()))
                .Returns((Func<Task> func) => func());
            
            // Initialize repository
            _repository = CreateRepository();
        }
        
        protected abstract TRepository CreateRepository();
        
        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }
    }
}