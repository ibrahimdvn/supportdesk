using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SupportTicketSystem.API.DTOs;
using SupportTicketSystem.API.Services;

namespace SupportTicketSystem.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketsController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    private int GetUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string GetUserRole() => User.FindFirstValue(ClaimTypes.Role)!;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketResponseDto>>> GetTickets([FromQuery] string? status)
    {
        var tickets = await _ticketService.GetAllTicketsAsync(GetUserId(), GetUserRole(), status);
        return Ok(tickets);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<TicketResponseDto>> GetTicket(int id)
    {
        try
        {
            var ticket = await _ticketService.GetTicketByIdAsync(id, GetUserId(), GetUserRole());
            return Ok(ticket);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost]
    public async Task<ActionResult<TicketResponseDto>> CreateTicket(CreateTicketDto createDto)
    {
        var ticket = await _ticketService.CreateTicketAsync(createDto, GetUserId());
        return CreatedAtAction(nameof(GetTicket), new { id = ticket.Id }, ticket);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<TicketResponseDto>> UpdateTicket(int id, UpdateTicketDto updateDto)
    {
        try
        {
            var ticket = await _ticketService.UpdateTicketAsync(id, updateDto, GetUserId(), GetUserRole());
            return Ok(ticket);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        try
        {
            await _ticketService.DeleteTicketAsync(id, GetUserId(), GetUserRole());
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
    {
        var stats = await _ticketService.GetDashboardStatsAsync(GetUserId(), GetUserRole());
        return Ok(stats);
    }

    [HttpPost("{id}/comments")]
    public async Task<ActionResult<CommentResponseDto>> AddComment(int id, CreateCommentDto commentDto)
    {
        try
        {
            var comment = await _ticketService.AddCommentAsync(id, commentDto, GetUserId());
            return Ok(comment);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{id}/comments")]
    public async Task<ActionResult<IEnumerable<CommentResponseDto>>> GetComments(int id)
    {
        try
        {
            var comments = await _ticketService.GetTicketCommentsAsync(id, GetUserId(), GetUserRole());
            return Ok(comments);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpDelete("{id}/comments/{commentId}")]
    public async Task<IActionResult> DeleteComment(int id, int commentId)
    {
        try
        {
            await _ticketService.DeleteCommentAsync(id, commentId, GetUserId(), GetUserRole());
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
