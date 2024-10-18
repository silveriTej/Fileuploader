import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FileWithProgress {
  file: File;
  progress: number;
  preview: string | ArrayBuffer | null;
  displayed: boolean; // Track whether to display the file item
  hideProgressBar: boolean; // Flag to hide progress bar after display
}

@Component({
  selector: 'app-file-uploader',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-uploader.component.html',
  styleUrls: ['./file-uploader.component.css'],
})
export class FileUploaderComponent {
  @Input() allowMultiple: boolean = false;
  @Input() allowedFileTypes: string[] = [
    'image/png',
    'image/jpeg',
    'application/pdf',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'application/msword',
    'text/plain',
  ];
  @Input() maxFileSize: number = 5 * 1024 * 1024;

  @Output() fileChange = new EventEmitter<FileWithProgress[]>(); 

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  filesWithProgress: FileWithProgress[] = [];
  errorMessage: string = '';
  successMessage: string = '';

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const selectedFiles = input.files;

    if (!selectedFiles || selectedFiles.length === 0) return;

    this.errorMessage = '';
    this.successMessage = '';

    const newFiles: FileWithProgress[] = [];

    if (!this.allowMultiple) {
      this.filesWithProgress = [];
    }

    Array.from(selectedFiles).forEach((file) => {
      if (this.isDuplicate(file)) {
        this.errorMessage = `File "${file.name}" already uploaded!`;
      } else if (this.validateFile(file)) {
        const fileWithProgress: FileWithProgress = {
          file,
          progress: 0, // Start with 0% progress
          preview: null,
          displayed: false, // Initially not displayed
          hideProgressBar: false, // Progress bar visibility flag
        };

        // Simulate file upload progress
        this.simulateFileUpload(fileWithProgress)
          .then(() => {
            fileWithProgress.progress = 100; // Set progress to 100%
            return this.generatePreview(file);
          })
          .then(preview => {
            fileWithProgress.preview = preview;
            fileWithProgress.displayed = true; // Display the file after upload
            fileWithProgress.hideProgressBar = true; // Hide progress bar after displaying

            // Emit updated file list after progress bar is hidden
            this.fileChange.emit(this.filesWithProgress);

            // You can set a timeout if needed to remove the progress bar after some time
            setTimeout(() => {
              this.fileChange.emit(this.filesWithProgress); // Emit again if needed
            }, 1000); // Adjust time to your preference
          });

        this.filesWithProgress.push(fileWithProgress);
        newFiles.push(fileWithProgress);
      } else {
        this.errorMessage = 'File validation failed!';
      }
    });

    if (newFiles.length > 0) {
      this.fileChange.emit(this.filesWithProgress); 
    }

    this.fileInput.nativeElement.value = '';
  }

  isDuplicate(file: File): boolean {
    return this.filesWithProgress.some((existingFile) => existingFile.file.name === file.name);
  }

  validateFile(file: File): boolean {
    if (!this.allowedFileTypes.includes(file.type)) {
      this.errorMessage = 'Unsupported file type!';
      return false;
    }
    if (file.size > this.maxFileSize) {
      this.errorMessage = `File size exceeds the maximum limit of ${this.maxFileSize / (1024 * 1024)} MB!`;
      return false;
    }
    return true;
  }

  async simulateFileUpload(fileWithProgress: FileWithProgress): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (fileWithProgress.progress < 100) {
          fileWithProgress.progress += 20; // Simulate progress (adjust as needed)
        } else {
          clearInterval(interval);
          resolve(); // Resolve when progress reaches 100%
        }
      }, 200); // Adjust interval timing as needed
    });
  }

  async generatePreview(file: File): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf' || file.type === 'text/plain') {
        resolve(URL.createObjectURL(file));
      } else if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        resolve(URL.createObjectURL(file));
      } else {
        resolve(null);
      }
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer?.files;

    if (files) {
      this.onFileSelected({ target: { files } } as any);
    }
  }

  removeFile(index: number): void {
    this.filesWithProgress.splice(index, 1);

    if (!this.allowMultiple && this.filesWithProgress.length === 0) {
      this.fileInput.nativeElement.value = '';
    }

    this.fileChange.emit(this.filesWithProgress); 
  }
}
