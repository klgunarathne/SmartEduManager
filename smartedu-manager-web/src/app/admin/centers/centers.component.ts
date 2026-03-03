import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CenterService } from '../../core/services/center.service';
import { DistrictService } from '../../core/services/district.service';
import { Center, District, CreateCenterDto, UpdateCenterDto } from '../../core/models';

@Component({
  selector: 'app-centers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './centers.component.html',
  styleUrls: ['./centers.component.scss']
})
export class CentersComponent implements OnInit {
  private centerService = inject(CenterService);
  private districtService = inject(DistrictService);
  private fb = inject(FormBuilder);

  centers = signal<Center[]>([]);
  districts = signal<District[]>([]);
  isLoading = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  editingId = signal<number | null>(null);

  centerForm: FormGroup = this.fb.group({
    centerName: ['', Validators.required],
    districtId: ['', Validators.required],
    address: ['', Validators.required],
    contactNumber: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadCenters();
    this.loadDistricts();
  }

  loadCenters(): void {
    this.isLoading.set(true);
    this.centerService.getCenters().subscribe({
      next: (data) => {
        this.centers.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadDistricts(): void {
    this.districtService.getDistricts().subscribe({
      next: (data) => {
        this.districts.set(data);
      },
      error: () => {
        console.error('Error loading districts');
      }
    });
  }

  onSubmit(): void {
    if (this.centerForm.invalid) return;
    this.isLoading.set(true);

    if (this.isEditing() && this.editingId() !== null) {
      const formData: UpdateCenterDto = {
        centerName: this.centerForm.value.centerName,
        districtId: this.centerForm.value.districtId,
        address: this.centerForm.value.address,
        contactNumber: this.centerForm.value.contactNumber
      };
      this.centerService.updateCenter(this.editingId()!, formData).subscribe({
        next: () => {
          this.resetForm();
          this.loadCenters();
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    } else {
      const formData: CreateCenterDto = {
        centerName: this.centerForm.value.centerName,
        districtId: this.centerForm.value.districtId,
        address: this.centerForm.value.address,
        contactNumber: this.centerForm.value.contactNumber
      };
      this.centerService.createCenter(formData).subscribe({
        next: () => {
          this.resetForm();
          this.loadCenters();
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    }
  }

  editCenter(center: Center): void {
    this.isEditing.set(true);
    this.editingId.set(center.centerId);
    this.centerForm.patchValue(center);
  }

  deleteCenter(id: number): void {
    if (confirm('Are you sure you want to delete this center?')) {
      this.isLoading.set(true);
      this.centerService.deleteCenter(id).subscribe({
        next: () => {
          this.loadCenters();
        },
        error: () => {
          this.isLoading.set(false);
        }
      });
    }
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.centerForm.reset({ centerName: '', districtId: '', address: '', contactNumber: '' });
    this.isEditing.set(false);
    this.editingId.set(null);
    this.isLoading.set(false);
  }

  getDistrictName(districtId: number): string {
    const district = this.districts().find(d => d.districtId === districtId);
    return district ? district.districtName : 'Unknown';
  }
}
