using System;
using Xunit;

namespace OrderingAppBackend.Tests
{
    public class BasicTests
    {
        [Fact]
        public void SimpleTest_ShouldPass()
        {
            // Ein einfacher Test, der immer bestehen sollte
            Assert.True(true);
        }

        [Fact]
        public void SimpleArithmetic_ShouldWork()
        {
            // Grundlegende Arithmetik
            int a = 2;
            int b = 3;
            Assert.Equal(5, a + b);
        }
    }
}