import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

interface FileWithProgress {
  file: File;
  progress: number;
  preview: string | ArrayBuffer | null;
  displayed: boolean; 
  hideProgressBar: boolean; 
  content?: string; 
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
        this.clearMessages();
      } else {
        const validation = this.validateFile(file);
        if (validation.isValid) {
          const fileWithProgress: FileWithProgress = {
            file,
            progress: 0, 
            preview: null,
            displayed: false, 
            hideProgressBar: false,
          };

          this.simulateFileUpload(fileWithProgress)
            .then(() => {
              fileWithProgress.progress = 100;
              return this.generatePreview(file);
            })
            .then(preview => {
              fileWithProgress.preview = preview;
              fileWithProgress.displayed = true; 
              fileWithProgress.hideProgressBar = true; 

        
              this.successMessage = `File "${file.name}" uploaded successfully!`;
              this.clearMessages(); 

     
              this.fileChange.emit(this.filesWithProgress);
            });

          this.filesWithProgress.push(fileWithProgress);
          newFiles.push(fileWithProgress);
        } else {
      
          if (validation.errorMessage) {
            this.errorMessage = validation.errorMessage; 
            this.clearMessages(); 
          }
        }
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

  validateFile(file: File): { isValid: boolean; errorMessage?: string } {
    if (!this.allowedFileTypes.includes(file.type)) {
      return {
        isValid: false,
        errorMessage: 'Unsupported file type! Please upload a PNG, JPEG, PDF, MP3, WAV, MP4, DOC, or TXT file.'
      };
    }
    if (file.size > this.maxFileSize) {
      return {
        isValid: false,
        errorMessage: `File size exceeds the maximum limit of ${this.maxFileSize / (1024 * 1024)} MB!`
      };
    }
    return { isValid: true };
  }

  async simulateFileUpload(fileWithProgress: FileWithProgress): Promise<void> {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (fileWithProgress.progress < 100) {
          fileWithProgress.progress += 20; 
        } else {
          clearInterval(interval);
          resolve(); 
        }
      }, 200); 
    });
  }

  async generatePreview(file: File): Promise<string | ArrayBuffer | null> {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf' || file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = () => {
          if (file.type === 'text/plain') {
         
            this.filesWithProgress.find(f => f.file.name === file.name)!.content = reader.result as string;
          }
          resolve(URL.createObjectURL(file));
        };
        reader.readAsArrayBuffer(file);
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

  clearMessages(): void {
    setTimeout(() => {
      this.successMessage = '';
      this.errorMessage = '';
    }, 1000);
  }
}
