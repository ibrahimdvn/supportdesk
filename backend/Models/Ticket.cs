using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SupportTicketSystem.API.Models;

public class Ticket
{
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Description { get; set; } = string.Empty;

    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    
    public TicketStatus Status { get; set; } = TicketStatus.Open;

    [MaxLength(100)]
    public string Category { get; set; } = "General";

    public int CreatedById { get; set; }
    [ForeignKey("CreatedById")]
    public User? CreatedBy { get; set; }

    public int? AssignedToId { get; set; }
    [ForeignKey("AssignedToId")]
    public User? AssignedTo { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
}
