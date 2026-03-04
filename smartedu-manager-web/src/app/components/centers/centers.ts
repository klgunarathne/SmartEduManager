import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CenterService, Center, CreateCenter, District } from '../../services/center.service';

@Component({
  selector: 'app-centers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './centers.html',
  styleUrl: './centers.scss'
})
export class CentersComponent implements OnInit {
  showModal = signal(false);
  modalMode = signal<'add' | 'edit'>('add');
  
  searchTerm = signal('');
  currentPage = signal(1);
  pageSize = 10;

  selectedCenter: CreateCenter = this.getEmptyCenter();
  districts = signal<District[]>([]);

  constructor(private centerService: CenterService) {}

  ngOnInit(): void {
    this.centerService.getCenters().subscribe();
    this.centerService.getDistricts().subscribe({
      next: (data) => this.districts.set(data)
    });
  }

  private getEmptyCenter(): CreateCenter {
    return {
      centerName: '',
      districtId: 0,
      address: '',
      contactNumber: ''
    };
  }

  openAddModal(): void {
    this.selectedCenter = this.getEmptyCenter();
    this.modalMode.set('add');
    this.showModal.set(true);
  }

  openEditModal(center: Center): void {
    this.selectedCenter = {
      centerName: center.centerName,
      districtId: center.districtId,
      address: center.address,
      contactNumber: center.contactNumber
    };
    this.modalMode.set('edit');
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.selectedCenter = this.getEmptyCenter();
  }

  saveCenter(): void {
    if (this.modalMode() === 'add') {
      this.centerService.createCenter(this.selectedCenter).subscribe({
        next: () => this.closeModal(),
        error: (error) => alert('Failed to create center: ' + (error.error?.message || error.message))
      });
    } else {
      const id = (this.centerService.centers().find(c => c.centerName === this.selectedCenter.centerName))?.centerId;
      if (id) {
        this.centerService.updateCenter(id, this.selectedCenter).subscribe({
          next: () => this.closeModal(),
          error: (error) => alert('Failed to update center: ' + (error.error?.message || error.message))
        });
      }
    }
  }

  deleteCenter(center: Center): void {
    if (confirm(`Are you sure you want to delete ${center.centerName}?`)) {
      this.centerService.deleteCenter(center.centerId).subscribe({
        next: () => {},
        error: (error) => alert('Failed to delete center')
      });
    }
  }

  get centers(): Center[] {
    return this.centerService.centers();
  }

  get isLoading(): boolean {
    return this.centerService.isLoading();
  }

  get filteredCenters(): Center[] {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.centers;
    return this.centers.filter(c => 
      c.centerName?.toLowerCase().includes(term) ||
      c.districtName?.toLowerCase().includes(term) ||
      c.address?.toLowerCase().includes(term)
    );
  }

  get paginatedCenters(): Center[] {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredCenters.slice(start, start + this.pageSize);
  }

  totalPagesCount(): number {
    return Math.ceil(this.filteredCenters.length / this.pageSize);
  }

  prevPage(): void {
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPagesCount()) this.currentPage.update(p => p + 1);
  }
}
