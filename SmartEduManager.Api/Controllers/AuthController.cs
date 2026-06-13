using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartEduManager.Api.Data;
using SmartEduManager.Api.DTOs;
using SmartEduManager.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly IMapper _mapper;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;
    private readonly AppDbContext _context;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole> roleManager,
        IMapper mapper,
        IConfiguration configuration,
        ILogger<AuthController> logger,
        AppDbContext context)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _mapper = mapper;
        _configuration = configuration;
        _logger = logger;
        _context = context;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userExists = await _userManager.FindByEmailAsync(registerDto.Email);
            if (userExists != null)
                return BadRequest("User already exists");

            var user = _mapper.Map<ApplicationUser>(registerDto);
            user.UserName = registerDto.Email;

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded)
                return BadRequest(new { Errors = result.Errors.Select(e => e.Description) });

            // Assign default role
            if (!await _roleManager.RoleExistsAsync("User"))
                await _roleManager.CreateAsync(new IdentityRole("User"));

            await _userManager.AddToRoleAsync(user, "User");

            _logger.LogInformation($"User registered successfully: {user.Email}");

            return Ok(new { Message = "User registered successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error registering user");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
                return Unauthorized("Invalid email or password");

            var userRoles = await _userManager.GetRolesAsync(user);

            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.GivenName, user.FirstName),
            };

            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            }

            var token = GetToken(authClaims);

            // Generate refresh token and store in database
            var refreshToken = GenerateRefreshToken();
            var storedRefreshToken = new RefreshToken
            {
                Token = HashRefreshToken(refreshToken),
                UserId = user.Id,
                Expires = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["Jwt:DurationInDays"])),
                CreatedByIp = GetIpAddress()
            };
            _context.RefreshTokens.Add(storedRefreshToken);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"User logged in successfully: {user.Email}");

            var userDto = _mapper.Map<UserDto>(user);
            userDto.Roles = userRoles;

            return Ok(new 
            {
                AccessToken = new JwtSecurityTokenHandler().WriteToken(token),
                RefreshToken = refreshToken,
                ExpiresAt = token.ValidTo,
                User = userDto
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error logging in user");
            return StatusCode(500, "Internal server error");
        }
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile(string userEmail)
    {
        try
        {
            var requestedUser = await _userManager.FindByEmailAsync(userEmail);
            if (requestedUser == null)
                return Unauthorized();

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var isAdmin = User.IsInRole("Admin");

            if (!isAdmin && !string.Equals(requestedUser.Id, currentUserId, StringComparison.Ordinal))
                return Forbid();

            var userRoles = await _userManager.GetRolesAsync(requestedUser);
            var userDto = _mapper.Map<UserDto>(requestedUser);
            userDto.Roles = userRoles;

            return Ok(userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile");
            return StatusCode(500, "Internal server error");
        }
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto refreshTokenDto)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var principal = GetPrincipalFromExpiredToken(refreshTokenDto.AccessToken);
            if (principal == null)
                return BadRequest("Invalid token");

            var userEmail = principal.FindFirst(ClaimTypes.Email)?.Value;
            var user = await _userManager.FindByEmailAsync(userEmail!);
            if (user == null)
                return BadRequest("Invalid token");

            var refreshTokenHash = HashRefreshToken(refreshTokenDto.RefreshToken);
            var storedRefreshToken = await _context.RefreshTokens.FirstOrDefaultAsync(t =>
                t.Token == refreshTokenHash && t.UserId == user.Id && !t.IsRevoked && !t.IsUsed && t.Expires > DateTime.UtcNow);

            if (storedRefreshToken == null)
                return BadRequest("Invalid refresh token");

            // Revoke old refresh token
            storedRefreshToken.IsUsed = true;
            storedRefreshToken.IsRevoked = true;
            storedRefreshToken.RevokedAt = DateTime.UtcNow;
            storedRefreshToken.RevokedByIp = GetIpAddress();
            _context.RefreshTokens.Update(storedRefreshToken);

            // Generate new tokens
            var userRoles = await _userManager.GetRolesAsync(user);
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.Name, user.UserName!),
                new Claim(ClaimTypes.Email, user.Email!),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.GivenName, user.FirstName),
            };

            foreach (var userRole in userRoles)
            {
                authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            }

            var newAccessToken = GetToken(authClaims);
            var newRefreshToken = GenerateRefreshToken();

            // Save new refresh token
            var newStoredRefreshToken = new RefreshToken
            {
                Token = HashRefreshToken(newRefreshToken),
                UserId = user.Id,
                Expires = DateTime.UtcNow.AddDays(Convert.ToDouble(_configuration["Jwt:DurationInDays"])),
                CreatedByIp = GetIpAddress()
            };
            _context.RefreshTokens.Add(newStoredRefreshToken);
            await _context.SaveChangesAsync();

            _logger.LogInformation($"Token refreshed successfully for user: {user.Email}");

            return Ok(new TokenDto
            {
                AccessToken = new JwtSecurityTokenHandler().WriteToken(newAccessToken),
                RefreshToken = newRefreshToken,
                ExpiresAt = newAccessToken.ValidTo
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error refreshing token");
            return StatusCode(500, "Internal server error");
        }
    }

    private JwtSecurityToken GetToken(List<Claim> authClaims)
    {
        var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            expires: DateTime.Now.AddDays(Convert.ToDouble(_configuration["Jwt:DurationInDays"])),
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        );

        return token;
    }

    private string GenerateRefreshToken()
    {
        var tokenBytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToBase64String(tokenBytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private string HashRefreshToken(string refreshToken)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(refreshToken));
        return Convert.ToBase64String(hashBytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidAudience = _configuration["Jwt:Audience"],
            ValidIssuer = _configuration["Jwt:Issuer"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)),
            ValidateLifetime = false // Ignore token expiration for refresh
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
        
        if (securityToken is not JwtSecurityToken jwtSecurityToken || 
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            return null;
        }

        return principal;
    }

    private string GetIpAddress()
    {
        if (Request.Headers.ContainsKey("X-Forwarded-For"))
            return Request.Headers["X-Forwarded-For"].ToString().Split(',')[0].Trim();
        
        return HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown";
    }
}