using Microsoft.EntityFrameworkCore;
using SupportTicketSystem.API.Data;
using SupportTicketSystem.API.DTOs;
using SupportTicketSystem.API.Models;

namespace SupportTicketSystem.API.Services;

public class TicketService : ITicketService
{
    private readonly AppDbContext _context;

    public TicketService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<TicketResponseDto>> GetAllTicketsAsync(int userId, string role, string? status = null)
    {
        var query = _context.Tickets
            .Include(t => t.CreatedBy)
            .Include(t => t.AssignedTo)
            .AsQueryable();

        if (role == Role.Employee.ToString())
        {
            query = query.Where(t => t.CreatedById == userId);
        }
        else if (role == Role.SupportAgent.ToString())
        {
            query = query.Where(t => t.AssignedToId == userId || t.AssignedToId == null);
        }

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<TicketStatus>(status, true, out var ticketStatus))
        {
            query = query.Where(t => t.Status == ticketStatus);
        }

        var tickets = await query.OrderByDescending(t => t.CreatedAt).ToListAsync();
        return tickets.Select(MapToResponseDto);
    }

    public async Task<TicketResponseDto> GetTicketByIdAsync(int id, int userId, string role)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedBy)
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
            throw new KeyNotFoundException("Ticket not found");

        if (role == Role.Employee.ToString() && ticket.CreatedById != userId)
            throw new UnauthorizedAccessException("You don't have access to this ticket");

        return MapToResponseDto(ticket);
    }

    public async Task<TicketResponseDto> CreateTicketAsync(CreateTicketDto createDto, int userId)
    {
        var ticket = new Ticket
        {
            Title = createDto.Title,
            Description = createDto.Description,
            Priority = createDto.Priority,
            Category = createDto.Category,
            CreatedById = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        // Load navigation properties for response
        await _context.Entry(ticket).Reference(t => t.CreatedBy).LoadAsync();

        return MapToResponseDto(ticket);
    }

    public async Task<TicketResponseDto> UpdateTicketAsync(int id, UpdateTicketDto updateDto, int userId, string role)
    {
        var ticket = await _context.Tickets
            .Include(t => t.CreatedBy)
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
            throw new KeyNotFoundException("Ticket not found");

        if (role == Role.Employee.ToString() && ticket.CreatedById != userId)
            throw new UnauthorizedAccessException("You can only update your own tickets");

        if (updateDto.Title != null) ticket.Title = updateDto.Title;
        if (updateDto.Description != null) ticket.Description = updateDto.Description;
        if (updateDto.Priority.HasValue) ticket.Priority = updateDto.Priority.Value;
        
        if (role != Role.Employee.ToString())
        {
            if (updateDto.Status.HasValue) ticket.Status = updateDto.Status.Value;
            if (updateDto.Category != null) ticket.Category = updateDto.Category;
            if (updateDto.AssignedToId.HasValue) ticket.AssignedToId = updateDto.AssignedToId.Value;
        }

        ticket.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return MapToResponseDto(ticket);
    }

    public async Task DeleteTicketAsync(int id, int userId, string role)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null)
            throw new KeyNotFoundException("Ticket not found");

        if (role != Role.Admin.ToString())
            throw new UnauthorizedAccessException("Only administrators can delete tickets");

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();

        // If the table is now empty, reset the autoincrement counter for SQLite
        if (!await _context.Tickets.AnyAsync())
        {
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM sqlite_sequence WHERE name='Tickets'");
        }
    }

    public async Task<DashboardStatsDto> GetDashboardStatsAsync(int userId, string role)
    {
        var query = _context.Tickets.AsQueryable();

        if (role == Role.Employee.ToString())
        {
            query = query.Where(t => t.CreatedById == userId);
        }
        else if (role == Role.SupportAgent.ToString())
        {
            query = query.Where(t => t.AssignedToId == userId);
        }

        var tickets = await query.ToListAsync();
        var totalUsers = await _context.Users.CountAsync();

        return new DashboardStatsDto
        {
            TotalTickets = tickets.Count,
            OpenTickets = tickets.Count(t => t.Status == TicketStatus.Open),
            ResolvedTickets = tickets.Count(t => t.Status == TicketStatus.Resolved),
            TotalUsers = totalUsers,
            TicketsByPriority = tickets.GroupBy(t => t.Priority.ToString())
                .ToDictionary(g => g.Key, g => g.Count())
        };
    }

    public async Task<CommentResponseDto> AddCommentAsync(int ticketId, CreateCommentDto commentDto, int userId)
    {
        var ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null)
            throw new KeyNotFoundException("Ticket not found");

        var comment = new Comment
        {
            Content = commentDto.Content,
            TicketId = ticketId,
            UserId = userId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        await _context.Entry(comment).Reference(c => c.User).LoadAsync();

        return new CommentResponseDto
        {
            Id = comment.Id,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            User = new UserDto
            {
                Id = comment.User!.Id,
                Name = comment.User.Name,
                Email = comment.User.Email,
                Role = comment.User.Role.ToString()
            }
        };
    }

    public async Task<IEnumerable<CommentResponseDto>> GetTicketCommentsAsync(int ticketId, int userId, string role)
    {
        var ticket = await _context.Tickets.FindAsync(ticketId);
        if (ticket == null)
            throw new KeyNotFoundException("Ticket not found");

        if (role == Role.Employee.ToString() && ticket.CreatedById != userId)
            throw new UnauthorizedAccessException("Not authorized to view these comments");

        var comments = await _context.Comments
            .Include(c => c.User)
            .Where(c => c.TicketId == ticketId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return comments.Select(c => new CommentResponseDto
        {
            Id = c.Id,
            Content = c.Content,
            CreatedAt = c.CreatedAt,
            User = new UserDto
            {
                Id = c.User!.Id,
                Name = c.User.Name,
                Email = c.User.Email,
                Role = c.User.Role.ToString()
            }
        });
    }

    public async Task DeleteCommentAsync(int ticketId, int commentId, int userId, string role)
    {
        var comment = await _context.Comments.FindAsync(commentId);
        if (comment == null)
            throw new KeyNotFoundException("Comment not found");

        if (comment.TicketId != ticketId)
            throw new InvalidOperationException("Comment does not belong to this ticket");

        if (role != Role.Admin.ToString() && comment.UserId != userId)
            throw new UnauthorizedAccessException("You are not authorized to delete this comment");

        _context.Comments.Remove(comment);
        await _context.SaveChangesAsync();
    }

    private TicketResponseDto MapToResponseDto(Ticket ticket)
    {
        return new TicketResponseDto
        {
            Id = ticket.Id,
            Title = ticket.Title,
            Description = ticket.Description,
            Priority = ticket.Priority.ToString(),
            Status = ticket.Status.ToString(),
            Category = ticket.Category,
            CreatedAt = ticket.CreatedAt,
            UpdatedAt = ticket.UpdatedAt,
            CreatedBy = new UserDto
            {
                Id = ticket.CreatedBy!.Id,
                Name = ticket.CreatedBy.Name,
                Email = ticket.CreatedBy.Email,
                Role = ticket.CreatedBy.Role.ToString()
            },
            AssignedTo = ticket.AssignedTo != null ? new UserDto
            {
                Id = ticket.AssignedTo.Id,
                Name = ticket.AssignedTo.Name,
                Email = ticket.AssignedTo.Email,
                Role = ticket.AssignedTo.Role.ToString()
            } : null
        };
    }
}
