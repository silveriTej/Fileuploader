import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { HttpClient, HttpEventType } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface FileWithProgress {
  file: File;
  progress: number;
  preview: string | ArrayBuffer | null;
  displayed: boolean;
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

  @Output() fileChange = new EventEmitter<any>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  filesWithProgress: FileWithProgress[] = [];
  errorMessage: string = '';
  successMessage: string = '';

  constructor(private http: HttpClient) {}

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
          progress: 0,
          preview: this.generatePreview(file),
          displayed: false,
        };
        this.filesWithProgress.push(fileWithProgress);
        newFiles.push(fileWithProgress);
        this.uploadFile(fileWithProgress);
      } else {
        this.errorMessage = 'File validation failed!';
      }
    });

    if (newFiles.length > 0) {
      if (this.allowMultiple) {
        this.fileChange.emit(this.filesWithProgress);
      } else {
        const singleFile = this.filesWithProgress[0];
        this.fileChange.emit(singleFile.file);
      }
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

  generatePreview(file: File): string | ArrayBuffer | null {
    const url = URL.createObjectURL(file);

    if (file.type.startsWith('image/')) {
      return url;
    } else if (file.type.startsWith('audio/')) {
      return url; 
    } else if (file.type.startsWith('video/')) {
      return url;
    }

    return null;
  }

  uploadFile(fileWithProgress: FileWithProgress): void {
    const formData = new FormData();
    formData.append('file', fileWithProgress.file, fileWithProgress.file.name);

    this.http.post('http://localhost:3000/api/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe(event => {
      if (event.type === HttpEventType.UploadProgress) {
        if (event.total) {
          fileWithProgress.progress = Math.round((100 * event.loaded) / event.total);
        }
      } else if (event.type === HttpEventType.Response) {
        fileWithProgress.displayed = true;
        this.successMessage = 'File uploaded successfully!';
        this.fileChange.emit(this.filesWithProgress);
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
      }
    }, error => {
      this.errorMessage = 'Upload failed!';
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
