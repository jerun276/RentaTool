using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Routing;
using RentaTool.Modules.Identity.Controllers;

namespace RentaTool.Modules.Identity.Tests;

/// <summary>Guards the five required Component 1 endpoint routes and their RBAC contracts.</summary>
public class EndpointContractTests
{
    [Theory]
    [InlineData(typeof(AuthController), "api/v1/auth")]
    [InlineData(typeof(UsersController), "api/v1/users")]
    [InlineData(typeof(KycController), "api/v1/users")]
    public void Controller_has_required_api_route(Type controller, string route)
    {
        Assert.Equal(route, controller.GetCustomAttribute<RouteAttribute>()?.Template);
    }

    [Theory]
    [InlineData(typeof(AuthController), nameof(AuthController.Register), "register", "POST")]
    [InlineData(typeof(AuthController), nameof(AuthController.Login), "login", "POST")]
    [InlineData(typeof(KycController), nameof(KycController.SubmitKyc), "kyc", "POST")]
    [InlineData(typeof(UsersController), nameof(UsersController.GetTrustScore), "{id:guid}/trust-score", "GET")]
    [InlineData(typeof(UsersController), nameof(UsersController.ReviewKyc), "{id:guid}/verification-status", "PATCH")]
    public void Required_endpoint_uses_the_correct_http_verb_and_path(Type controller, string methodName, string path, string verb)
    {
        var method = controller.GetMethod(methodName)!;
        var selector = method.GetCustomAttributes<HttpMethodAttribute>().Single();
        Assert.Equal(path, selector.Template); Assert.Contains(verb, selector.HttpMethods);
    }

    [Fact]
    public void Kyc_and_trust_score_require_an_authenticated_user()
    {
        Assert.NotNull(typeof(KycController).GetMethod(nameof(KycController.SubmitKyc))!.GetCustomAttribute<AuthorizeAttribute>());
        Assert.NotNull(typeof(UsersController).GetMethod(nameof(UsersController.GetTrustScore))!.GetCustomAttribute<AuthorizeAttribute>());
    }

    [Fact]
    public void Verification_status_is_restricted_to_admins()
    {
        var attribute = typeof(UsersController).GetMethod(nameof(UsersController.ReviewKyc))!.GetCustomAttribute<AuthorizeAttribute>();
        Assert.Equal("Admin", attribute?.Roles);
    }
}
