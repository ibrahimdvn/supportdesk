using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportTicketSystem.API.Data;
using SupportTicketSystem.API.DTOs;

namespace SupportTicketSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;

    public UsersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role.ToString()
            })
            .ToListAsync();

        return Ok(users);
    }

    [Authorize(Roles = "Admin")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound("User not found");
        
        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [Authorize(Roles = "Admin")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, UpdateUserDto updateDto)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return NotFound("User not found");

        if (!string.IsNullOrEmpty(updateDto.Name)) user.Name = updateDto.Name;
        if (!string.IsNullOrEmpty(updateDto.Email)) user.Email = updateDto.Email;
        if (!string.IsNullOrEmpty(updateDto.Role) && Enum.TryParse<SupportTicketSystem.API.Models.Role>(updateDto.Role, out var role))
        {
            user.Role = role;
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok();
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("update-settings")]
    public async Task<IActionResult> UpdateAdminSettings(UpdateAdminDto updateAdminDto)
    {
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Role == SupportTicketSystem.API.Models.Role.Admin);
        if (admin == null) return NotFound("Admin user not found");

        var usernameLower = updateAdminDto.Username.ToLower();
        if (await _context.Users.AnyAsync(u => u.Id != admin.Id && u.Email.ToLower() == usernameLower))
        {
            return BadRequest(new { message = "This username/email is already taken by another account." });
        }

        if (!string.IsNullOrEmpty(updateAdminDto.NewPassword))
        {
            var allUsers = await _context.Users.ToListAsync();
            foreach (var user in allUsers)
            {
                if (BCrypt.Net.BCrypt.Verify(updateAdminDto.NewPassword, user.PasswordHash))
                {
                    if (user.Id == admin.Id)
                    {
                        return BadRequest(new { message = "New password cannot be the same as your current password." });
                    }
                    else
                    {
                        return BadRequest(new { message = "This password is already in use by another account. Please choose a unique password." });
                    }
                }
            }
            admin.PasswordHash = BCrypt.Net.BCrypt.HashPassword(updateAdminDto.NewPassword);
        }

        admin.Email = updateAdminDto.Username;
        admin.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Admin settings updated successfully" });
    }
}
