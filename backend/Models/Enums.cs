namespace SupportTicketSystem.API.Models;

public enum Role
{
    Employee,
    SupportAgent,
    Admin
}

public enum TicketPriority
{
    Low,
    Medium,
    High,
    Critical
}

public enum TicketStatus
{
    Open,
    InProgress,
    Resolved,
    Closed
}
