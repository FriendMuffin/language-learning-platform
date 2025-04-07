// OrderingAppBackend.Tests/Services/Authentication/AuthServiceTests.cs
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using OrderingAppBackend.Data;
using OrderingAppBackend.Models;
using OrderingAppBackend.Services.Authentication;
using OrderingAppBackend.Tests.Helpers;

namespace OrderingAppBackend.Tests.Services.Authentication
{
    public class AuthServiceTests : IDisposable
    {
        private readonly AppDbContext _context;
        private readonly Mock<IJwtTokenService> _mockTokenService;
        private readonly Mock<IOptions<AuthSettings>> _mockOptions;
        private readonly Mock<ILogger<AuthService>> _mockLogger;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            _context = TestDbContextFactory.CreateInMemoryDbContext();
            _mockTokenService = new Mock<IJwtTokenService>();
            _mockOptions = new Mock<IOptions<AuthSettings>>();
            _mockLogger = new Mock<ILogger<AuthService>>();

            _mockOptions.Setup(opt => opt.Value).Returns(new AuthSettings
            {
                MinimumPasswordLength = 8,
                RequireDigits = true,
                RequireSpecialCharacters = true
            });

            _authService = new AuthService(_context, _mockTokenService.Object, _mockOptions.Object, _mockLogger.Object);
        }

        public void Dispose()
        {
            _context.Dispose();
        }

        [Fact]
        public async Task RegisterAsync_WithValidInput_ReturnsUserWithoutError()
        {
            // Arrange
            var email = "newuser@example.com";
            var password = "Password123!";

            // Act
            var result = await _authService.RegisterAsync(email, password);

            // Assert
            Assert.NotNull(result.user);
            Assert.Null(result.error);
            Assert.Equal(email, result.user.Email);
            Assert.Equal("Customer", result.user.Role);
            
            // Verify user was saved to database
            var savedUser = await _context.Users.FindAsync(result.user.Id);
            Assert.NotNull(savedUser);
            Assert.Equal(email, savedUser.Email);
        }

        [Fact]
        public async Task RegisterAsync_WithExistingEmail_ReturnsError()
        {
            // Arrange
            var email = "existing@example.com";
            var password = "Password123!";
            
            // Add existing user
            var existingUser = new User
            {
                Email = email,
                PasswordHash = "hash",
                Salt = "salt",
                Role = "Customer",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Users.Add(existingUser);
            await _context.SaveChangesAsync();

            // Act
            var result = await _authService.RegisterAsync(email, password);

            // Assert
            Assert.Null(result.user);
            Assert.NotNull(result.error);
            Assert.Contains("Email already registered", result.error);
        }

        [Theory]
        [InlineData("", "Password123!", "Email is required")]
        [InlineData("invalid", "Password123!", "Invalid email format")]
        [InlineData("valid@example.com", "", "Password is required")]
        [InlineData("valid@example.com", "short", "Password must be at least 8 characters")]
        [InlineData("valid@example.com", "password123", "Password must contain at least one special character")]
        [InlineData("valid@example.com", "Password!", "Password must contain at least one digit")]
        public async Task RegisterAsync_WithInvalidInput_ReturnsAppropriateError(string email, string password, string expectedErrorFragment)
        {
            // Act
            var result = await _authService.RegisterAsync(email, password);

            // Assert
            Assert.Null(result.user);
            Assert.NotNull(result.error);
            Assert.Contains(expectedErrorFragment, result.error);
        }

        [Fact]
        public async Task RegisterAsync_AsDelivererWithoutLocation_ReturnsError()
        {
            // Arrange
            var email = "deliverer@example.com";
            var password = "Password123!";
            var role = "Deliverer";

            // Act
            var result = await _authService.RegisterAsync(email, password, role);

            // Assert
            Assert.Null(result.user);
            Assert.NotNull(result.error);
            Assert.Contains("Location is required for deliverers", result.error);
        }

        [Fact]
        public async Task RegisterAsync_AsDelivererWithLocation_ReturnsUserAndCreatesDeliverer()
        {
            // Arrange
            var email = "deliverer@example.com";
            var password = "Password123!";
            var role = "Deliverer";
            var location = "Berlin, Germany";

            // Act
            var result = await _authService.RegisterAsync(email, password, role, location);

            // Assert
            Assert.NotNull(result.user);
            Assert.Null(result.error);
            Assert.Equal(email, result.user.Email);
            Assert.Equal(role, result.user.Role);
            
            // Verify deliverer was created
            var deliverer = await _context.Deliverers.FindAsync(1);
            Assert.NotNull(deliverer);
            Assert.Equal(email, deliverer.Email);
            Assert.Equal(location, deliverer.Location);
            Assert.Equal(result.user.Id, deliverer.UserId);
        }

        [Fact]
        public async Task LoginAsync_WithValidCredentials_ReturnsUserAndToken()
        {
            // Arrange
            var email = "login@example.com";
            var password = "Password123!";
            
            // First register a user
            await _authService.RegisterAsync(email, password);
            
            // Mock token generation
            _mockTokenService.Setup(svc => svc.GenerateJwtToken(It.IsAny<User>()))
                .Returns("test-jwt-token");

            // Act
            var result = await _authService.LoginAsync(email, password);

            // Assert
            Assert.NotNull(result.user);
            Assert.Equal("test-jwt-token", result.token);
            Assert.Null(result.error);
            Assert.Equal(email, result.user.Email);
        }

        [Fact]
        public async Task LoginAsync_WithInvalidPassword_ReturnsError()
        {
            // Arrange
            var email = "badpass@example.com";
            var password = "Password123!";
            
            // First register a user
            await _authService.RegisterAsync(email, password);

            // Act
            var result = await _authService.LoginAsync(email, "WrongPassword123!");

            // Assert
            Assert.Null(result.user);
            Assert.Equal(string.Empty, result.token);
            Assert.NotNull(result.error);
            Assert.Contains("Invalid credentials", result.error);
        }

        [Fact]
        public async Task LoginAsync_WithNonExistentEmail_ReturnsError()
        {
            // Act
            var result = await _authService.LoginAsync("nonexistent@example.com", "Password123!");

            // Assert
            Assert.Null(result.user);
            Assert.Equal(string.Empty, result.token);
            Assert.NotNull(result.error);
            Assert.Contains("Invalid credentials", result.error);
        }

        [Theory]
        [InlineData("", "Password123!")]
        [InlineData("valid@example.com", "")]
        public async Task LoginAsync_WithMissingInput_ReturnsAppropriateError(string email, string password)
        {
            // Act
            var result = await _authService.LoginAsync(email, password);

            // Assert
            Assert.Null(result.user);
            Assert.Equal(string.Empty, result.token);
            Assert.NotNull(result.error);
            Assert.Contains("required", result.error.ToLower());
        }
    }
}