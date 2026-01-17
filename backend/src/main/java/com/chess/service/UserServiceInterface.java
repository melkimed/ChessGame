package com.chess.service;

import com.chess.dto.UserDto;
import com.chess.model.User;
import java.util.List;
import java.util.Optional;

public interface UserServiceInterface {
    
    /**
     * Crée un nouveau utilisateur
     */
    UserDto createUser(String username, String password);
    
    /**
     * Authentifie un utilisateur
     */
    Optional<UserDto> authenticate(String username, String password);
    
    /**
     * Met à jour le statut en ligne d'un utilisateur
     */
    void setUserOnline(String username, boolean online);
    
    /**
     * Récupère tous les utilisateurs en ligne
     */
    List<UserDto> getOnlineUsers();
    
    /**
     * Trouve un utilisateur par son nom d'utilisateur
     */
    Optional<User> findByUsername(String username);
}