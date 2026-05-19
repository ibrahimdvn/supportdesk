using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SupportTicketSystem.API.Models;

public class User
{
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(150)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    public Role Role { get; set; } = Role.Employee;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [JsonIgnore]
    public ICollection<Ticket> CreatedTickets { get; set; } = new List<Ticket>();
    
    [JsonIgnore]
    public ICollection<Ticket> AssignedTickets { get; set; } = new List<Ticket>();
}
