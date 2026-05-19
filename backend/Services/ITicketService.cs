using SupportTicketSystem.API.DTOs;

namespace SupportTicketSystem.API.Services;

public interface ITicketService
{
    Task<IEnumerable<TicketResponseDto>> GetAllTicketsAsync(int userId, string role, string? status = null);
    Task<TicketResponseDto> GetTicketByIdAsync(int id, int userId, string role);
    Task<TicketResponseDto> CreateTicketAsync(CreateTicketDto createDto, int userId);
    Task<TicketResponseDto> UpdateTicketAsync(int id, UpdateTicketDto updateDto, int userId, string role);
    Task DeleteTicketAsync(int id, int userId, string role);
    Task<DashboardStatsDto> GetDashboardStatsAsync(int userId, string role);
    
    Task<CommentResponseDto> AddCommentAsync(int ticketId, CreateCommentDto commentDto, int userId);
    Task<IEnumerable<CommentResponseDto>> GetTicketCommentsAsync(int ticketId, int userId, string role);
    Task DeleteCommentAsync(int ticketId, int commentId, int userId, string role);
}
