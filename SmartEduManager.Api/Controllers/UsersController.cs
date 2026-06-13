using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartEduManager.Api.Models;
using System.Linq;
using System.Threading.Tasks;

namespace SmartEduManager.Api.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole> _roleManager;

    public UsersController(UserManager<ApplicationUser> userManager, RoleManager<IdentityRole> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userManager.Users.ToListAsync();

        var userDtos = new List<object>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            userDtos.Add(new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                address = user.Address,
                dateOfBirth = user.DateOfBirth,
                imageUrl = user.ImageUrl,
                roles = roles,
                status = user.EmailConfirmed ? "Active" : "Inactive",
                createdAt = user.CreatedAt,
                updatedAt = user.UpdatedAt
            });
        }

        return Ok(userDtos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            id = user.Id,
            firstName = user.FirstName,
            lastName = user.LastName,
            email = user.Email,
            address = user.Address,
            dateOfBirth = user.DateOfBirth,
            imageUrl = user.ImageUrl,
            roles = roles,
            status = user.EmailConfirmed ? "Active" : "Inactive",
            createdAt = user.CreatedAt,
            updatedAt = user.UpdatedAt
        });
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto userDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = new ApplicationUser
        {
            UserName = userDto.Email,
            Email = userDto.Email,
            FirstName = userDto.FirstName,
            LastName = userDto.LastName,
            Address = userDto.Address,
            DateOfBirth = userDto.DateOfBirth,
            ImageUrl = userDto.ImageUrl,
            EmailConfirmed = true // Auto confirm new users
        };

        var result = await _userManager.CreateAsync(user, userDto.Password);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        // Assign roles
        if (userDto.Roles != null && userDto.Roles.Any())
        {
            foreach (var roleName in userDto.Roles)
            {
                if (await _roleManager.RoleExistsAsync(roleName))
                {
                    await _userManager.AddToRoleAsync(user, roleName);
                }
            }
        }
        else
        {
            // Assign default role
            if (await _roleManager.RoleExistsAsync("User"))
            {
                await _userManager.AddToRoleAsync(user, "User");
            }
        }

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            id = user.Id,
            firstName = user.FirstName,
            lastName = user.LastName,
            email = user.Email,
            address = user.Address,
            dateOfBirth = user.DateOfBirth,
            imageUrl = user.ImageUrl,
            roles = roles,
            status = user.EmailConfirmed ? "Active" : "Inactive",
            createdAt = user.CreatedAt,
            updatedAt = user.UpdatedAt
        });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(string id, [FromBody] UpdateUserDto userDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        user.FirstName = userDto.FirstName;
        user.LastName = userDto.LastName;
        user.Email = userDto.Email;
        user.UserName = userDto.Email;
        user.Address = userDto.Address;
        user.DateOfBirth = userDto.DateOfBirth;
        user.ImageUrl = userDto.ImageUrl;
        user.EmailConfirmed = userDto.Status == "Active";

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        // Update roles
        var currentRoles = await _userManager.GetRolesAsync(user);
        var rolesToRemove = currentRoles.Except(userDto.Roles);
        var rolesToAdd = userDto.Roles.Except(currentRoles);

        foreach (var roleName in rolesToRemove)
        {
            await _userManager.RemoveFromRoleAsync(user, roleName);
        }

        foreach (var roleName in rolesToAdd)
        {
            if (await _roleManager.RoleExistsAsync(roleName))
            {
                await _userManager.AddToRoleAsync(user, roleName);
            }
        }

        var updatedRoles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            id = user.Id,
            firstName = user.FirstName,
            lastName = user.LastName,
            email = user.Email,
            address = user.Address,
            dateOfBirth = user.DateOfBirth,
            imageUrl = user.ImageUrl,
            roles = updatedRoles,
            status = user.EmailConfirmed ? "Active" : "Inactive",
            createdAt = user.CreatedAt,
            updatedAt = user.UpdatedAt
        });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return NoContent();
    }

    [HttpGet("roles")]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _roleManager.Roles
            .Select(r => new
            {
                id = r.Id,
                name = r.Name,
                description = $"{r.Name} role"
            })
            .ToListAsync();

        return Ok(roles);
    }

    [HttpPost("{id}/roles/{roleId}")]
    public async Task<IActionResult> AssignRole(string id, string roleId)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        var role = await _roleManager.FindByIdAsync(roleId);
        if (role == null)
        {
            return NotFound();
        }

        var roleName = role.Name;
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return NotFound();
        }

        var result = await _userManager.AddToRoleAsync(user, roleName);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok();
    }

    [HttpDelete("{id}/roles/{roleId}")]
    public async Task<IActionResult> RemoveRole(string id, string roleId)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
        {
            return NotFound();
        }

        var role = await _roleManager.FindByIdAsync(roleId);
        if (role == null)
        {
            return NotFound();
        }

        var roleName = role.Name;
        if (string.IsNullOrWhiteSpace(roleName))
        {
            return NotFound();
        }

        var result = await _userManager.RemoveFromRoleAsync(user, roleName);
        if (!result.Succeeded)
        {
            return BadRequest(result.Errors);
        }

        return Ok();
    }
}

public class CreateUserDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string Password { get; set; } = null!;
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> Roles { get; set; } = new List<string>();
}

public class UpdateUserDto
{
    public string FirstName { get; set; } = null!;
    public string LastName { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Address { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> Roles { get; set; } = new List<string>();
    public string Status { get; set; } = "Active";
}
