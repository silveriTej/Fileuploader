import { Component } from '@angular/core';
import { FileUploaderComponent } from './file-uploader/file-uploader.component';

interface FileWithProgress {
  file: File;
  progress: number;
  preview: string | ArrayBuffer | null;
  displayed: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FileUploaderComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'File Uploader';
  
  updatedFiles: FileWithProgress[] = [];

  handleFileChange(filesWithProgress: FileWithProgress[]): void {
  
    this.updatedFiles = filesWithProgress;
    console.log('Updated file list:', this.updatedFiles);
    this.displayFiles();
  }

  displayFiles(): void {
  console.log('Displaying files:', this.updatedFiles);

  }
}
