import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CenterService, District } from '../../services/center.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-districts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './districts.component.html',
  styleUrl: './districts.component.scss'
})
export class DistrictsComponent implements OnInit {
  private centerService = inject(CenterService);
  private toast = inject(ToastService);

  showModal = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;
  isLoading = signal(false);

  selectedDistrict: District = this.getEmptyDistrict();

  ngOnInit(): void {
    this.isLoading.set(true);
    this.centerService.getDistricts().subscribe({
      next: () => this.isLoading.set(false),
      error: () => this.isLoading.set(false)
    });
  }

  get districts(): District[] {
    return this.centerService.districts();
  }

  private getEmptyDistrict(): District {
    return {
      districtId: 0,
      districtName: ''
    };
  }

  openAddModal(): void {
    this.selectedDistrict = this.getEmptyDistrict();
    this.modalMode.set('add');
    this.showModal.set(true);
  }

  openEditModal(district: District): void {
    this.selectedDistrict = { ...district };
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedDistrict = this.getEmptyDistrict();
  }

  saveDistrict(): void {
    if (this.modalMode() === 'add') {
      this.centerService.createDistrict(this.selectedDistrict).subscribe({
        next: () => {
          this.closeModal();
          this.toast.success('District created successfully');
        },
        error: (error) => {
          console.error('Failed to create district:', error);
          this.toast.error('Failed to create district: ' + (error.error?.message || error.message));
        }
      });
    } else {
      this.centerService.updateDistrict(this.selectedDistrict.districtId, { districtName: this.selectedDistrict.districtName }).subscribe({
        next: () => {
          this.closeModal();
          this.toast.success('District updated successfully');
        },
        error: (error) => {
          console.error('Failed to update district:', error);
          this.toast.error('Failed to update district: ' + (error.error?.message || error.message));
        }
      });
    }
  }

  deleteDistrict(district: District): void {
    if (confirm(`Are you sure you want to delete ${district.districtName}?`)) {
      this.centerService.deleteDistrict(district.districtId).subscribe({
        next: () => {
          this.toast.success('District deleted successfully');
        },
        error: (error) => {
          console.error('Failed to delete district:', error);
          this.toast.error('Failed to delete district');
        }
      });
    }
  }

  get filteredDistricts(): District[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.districts;
    return this.districts.filter(d => d.districtName?.toLowerCase().includes(term));
  }

  get paginatedDistricts(): District[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredDistricts.slice(start, start + this.pageSize);
  }

  totalPagesCount(): number {
    return Math.ceil(this.filteredDistricts.length / this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPagesCount()) this.currentPage.update(p => p + 1);
  }
}