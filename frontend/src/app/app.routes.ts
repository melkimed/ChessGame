import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { GameLobbyComponent } from './components/game-lobby/game-lobby.component';
import { ChessBoardComponent } from './components/chess-board/chess-board.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'lobby', component: GameLobbyComponent },
  { path: 'game/:id', component: ChessBoardComponent }
];