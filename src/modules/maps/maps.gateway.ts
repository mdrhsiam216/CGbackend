import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common';
import { MapsService } from './maps.service';
import { WsJwtGuard } from './guards/ws-jwt.guard';
import { UpdateLocationDto, JoinBookingDto } from './dto/location.dto';
import { JwtUser } from '../auth/interfaces/auth.interface';
import { UserRole } from '../../shared/enums/user.enums';
import {
  MapsErrorMessages,
  MapsLogMessages,
  MapsResponseMessages,
} from '../../shared/enums';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/maps',
})
@UseGuards(WsJwtGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class MapsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MapsGateway.name);
  private readonly connectedClients = new Map<string, Set<string>>(); // userId -> Set of socketIds

  constructor(private readonly mapsService: MapsService) { }

  async handleConnection(client: Socket) {
    const user = client.data.user as JwtUser;
    if (!user) {
      this.logger.warn(MapsLogMessages.CONNECTION_REJECTED);
      client.disconnect();
      return;
    }

    // Track connected clients
    if (!this.connectedClients.has(user.userId)) {
      this.connectedClients.set(user.userId, new Set());
    }
    this.connectedClients.get(user.userId)!.add(client.id);

    this.logger.log(
      `${MapsLogMessages.CLIENT_CONNECTED}: ${client.id} (User: ${user.userId}, Email: ${user.email})`,
    );
  }

  async handleDisconnect(client: Socket) {
    const user = client.data.user as JwtUser;
    if (user) {
      const userSockets = this.connectedClients.get(user.userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.connectedClients.delete(user.userId);
        }
      }

      this.logger.log(
        `${MapsLogMessages.CLIENT_DISCONNECTED}: ${client.id} (User: ${user.userId})`,
      );
    }
  }

  /**
   * Join a booking room to receive location updates
   */
  @SubscribeMessage('joinBooking')
  async handleJoinBooking(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: JoinBookingDto,
  ) {
    const user = client.data.user as JwtUser;
    const { bookingId } = data;

    try {
      // Validate booking access
      await this.mapsService.validateBookingAccess(bookingId, user);

      // Join the booking room
      const room = `booking:${bookingId}`;
      await client.join(room);

      this.logger.log(
        `${MapsLogMessages.USER_JOINED_BOOKING_ROOM}: ${user.userId} - ${room}`,
      );

      // Send last known location if available
      const lastLocation = await this.mapsService.getLastLocation(
        bookingId,
        user,
      );

      if (lastLocation) {
        client.emit('locationUpdate', lastLocation);
      }

      // Acknowledge join
      client.emit('joinedBooking', {
        bookingId,
        message: MapsResponseMessages.BOOKING_ROOM_JOINED,
      });
    } catch (error) {
      this.logger.error(
        `${MapsLogMessages.ERROR_JOINING_BOOKING_ROOM}: ${error.message}`,
        error.stack,
      );
      client.emit('error', {
        message: error.message || MapsErrorMessages.JOIN_BOOKING_ROOM_FAILED,
      });
    }
  }

  /**
   * Handle location update from caregiver
   */
  @SubscribeMessage('updateLocation')
  async handleUpdateLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: UpdateLocationDto,
  ) {
    const user = client.data.user as JwtUser;
    const { bookingId, lat, lng } = data;

    try {
      // Check if user is a caregiver
      const isCaregiver = user.roles.some(
        (role) => role.toLowerCase() === UserRole.CAREGIVER.toLowerCase(),
      );

      if (!isCaregiver) {
        throw new Error(MapsErrorMessages.ONLY_CAREGIVERS_CAN_UPDATE);
      }

      // Update location in cache
      const locationUpdate = await this.mapsService.updateCaregiverLocation(
        bookingId,
        user.userId,
        lat,
        lng,
      );

      // Broadcast to all clients in the booking room (including the client)
      const room = `booking:${bookingId}`;
      this.server.to(room).emit('locationUpdate', locationUpdate);

      this.logger.log(
        `${MapsLogMessages.LOCATION_UPDATED_FOR_BOOKING} ${bookingId} by caregiver ${user.userId}`,
      );

      // Acknowledge update
      client.emit('locationUpdated', {
        success: true,
        message: MapsResponseMessages.LOCATION_UPDATED,
      });
    } catch (error) {
      this.logger.error(
        `${MapsLogMessages.ERROR_UPDATING_LOCATION}: ${error.message}`,
        error.stack,
      );
      client.emit('error', {
        message: error.message || MapsErrorMessages.LOCATION_UPDATE_FAILED,
      });
    }
  }

  /**
   * Request last known location
   */
  @SubscribeMessage('getLastLocation')
  async handleGetLastLocation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { bookingId: string },
  ) {
    const user = client.data.user as JwtUser;
    const { bookingId } = data;

    try {
      const lastLocation = await this.mapsService.getLastLocation(
        bookingId,
        user,
      );

      if (lastLocation) {
        client.emit('locationUpdate', lastLocation);
      } else {
        client.emit('noLocation', {
          bookingId,
          message: MapsResponseMessages.NO_LOCATION_DATA,
        });
      }
    } catch (error) {
      this.logger.error(
        `${MapsLogMessages.ERROR_GETTING_LAST_LOCATION}: ${error.message}`,
        error.stack,
      );
      client.emit('error', {
        message: error.message || MapsErrorMessages.GET_LAST_LOCATION_FAILED,
      });
    }
  }
}
