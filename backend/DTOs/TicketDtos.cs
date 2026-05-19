using System.ComponentModel.DataAnnotations;
using SupportTicketSystem.API.Models;

namespace SupportTicketSystem.API.DTOs;

public class CreateTicketDto
{
    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    
    [MaxLength(100)]
    public string Category { get; set; } = "General";
}

public class UpdateTicketDto
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public TicketPriority? Priority { get; set; }
    public TicketStatus? Status { get; set; }
    public string? Category { get; set; }
    public int? AssignedToId { get; set; }
}

public class TicketResponseDto
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Priority { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    
    public UserDto CreatedBy { get; set; } = null!;
    public UserDto? AssignedTo { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class DashboardStatsDto
{
    public int TotalTickets { get; set; }
    public int OpenTickets { get; set; }
    public int ResolvedTickets { get; set; }
    public int TotalUsers { get; set; }
    public Dictionary<string, int> TicketsByPriority { get; set; } = new();
}

public class CreateCommentDto
{
    [Required]
    public string Content { get; set; } = string.Empty;
}

public class CommentResponseDto
{
    public int Id { get; set; }
    public string Content { get; set; } = string.Empty;
    public UserDto User { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}
