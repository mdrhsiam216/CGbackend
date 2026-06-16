import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserRole } from '../../user-role/entities/user-role.entity';
import { ClientProfile } from '../../client-profile/entities/client-profile.entity';
import { CaregiverProfile } from '../../caregiver-profile/entities/caregiver-profile.entity';
import { Address } from 'src/modules/address/entities/address.entity';
import { Payment } from 'src/modules/SSL_Commerce/entity/SSL_payment.entity';
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({ unique: true })
  email: string;
  @Column({ nullable: true })
  firstName?: string;
  @Column({ nullable: true })
  lastName?: string;

  @Column({ nullable: true })
  gender?: string;

  @Column()
  password: string;
  @Column()
  phone: string;
  @Column()
  status: string;
  @Column({ type: 'boolean', default: false })
  phoneVerified: boolean;
  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;
  @Column({ type: 'text', nullable: true })
  avatarKey?: string;
  @CreateDateColumn()
  createdAt: Date;
  @UpdateDateColumn()
  updatedAt: Date;
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];

  @OneToOne(() => ClientProfile, (clientProfile) => clientProfile.user)
  clientProfile: ClientProfile;

  @OneToOne(() => CaregiverProfile, (caregiverProfile) => caregiverProfile.user)
  caregiverProfile: CaregiverProfile;

  @OneToMany(() => Address, (address) => address.user)
  addresses: Address[];
  @OneToMany('Auth', 'user')
  authSessions: any[];
  @OneToMany('Booking', 'user')
  bookings: any[];

  @Column({ type: 'jsonb', nullable: true })
  emergencyContacts: {
    primary: { name: string; phone: string; relationship: string };
    secondary?: { name: string; phone: string; relationship: string };
  };

  @OneToMany(() => Payment, (payment) => payment.user)
  payments: Payment[];
}
