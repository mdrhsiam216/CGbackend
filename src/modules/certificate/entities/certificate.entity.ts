import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CaregiverProfile } from '../../caregiver-profile/entities/caregiver-profile.entity';

export enum CertificateStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => CaregiverProfile,
    (caregiverProfile) => caregiverProfile.certificates,
    { onDelete: 'CASCADE', nullable: false },
  )
  @JoinColumn({ name: 'caregiverProfileId' })
  caregiverProfile: CaregiverProfile;

  @Column({ type: 'uuid', nullable: false })
  caregiverProfileId: string;

  @Column({ type: 'varchar', length: 255, nullable: false })
  title: string;

  @Column({ type: 'text', nullable: true })
  institution: string;

  @Column({ type: 'text', nullable: true })
  yearOfCompletion: string;

  @Column({ type: 'text', nullable: false })
  certificateUrl: string;

  @Column({ type: 'text', nullable: false })
  certificateKey: string;

  @Column({
    type: 'enum',
    enum: CertificateStatus,
    default: CertificateStatus.APPROVED,
  })
  status: CertificateStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;
}
