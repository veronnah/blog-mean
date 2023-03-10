import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { PostModel } from "../../models/post.model";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { PostsService } from "../../services/posts.service";
import { ActivatedRoute, ParamMap, Router } from "@angular/router";
import { mimeType } from "./mime-type.validator";

@Component({
  selector: 'app-post-create',
  templateUrl: './post-create.component.html',
  styleUrls: ['./post-create.component.scss']
})
export class PostCreateComponent implements OnInit {
  @Output() postCreated: EventEmitter<PostModel> = new EventEmitter<PostModel>();

  private mode: string = 'create';
  private postId: string;
  public post: PostModel;
  public isLoading: boolean;
  public form: FormGroup;
  public imagePreview: string | ArrayBuffer;

  constructor(
    private postsService: PostsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
  }

  ngOnInit(): void {
    this.initForm();
    this.getPostData();
  }

  public getPostData(): void {
    this.route.paramMap.subscribe((param: ParamMap) => {
      if (param.has('postId')) {
        this.mode = 'edit';
        this.postId = param.get('postId');
        this.isLoading = true;

        this.postsService.getPost(this.postId).subscribe({
          next: (response: PostModel) => {
            this.isLoading = false;
            this.post = response;
            this.imagePreview = this.post.imagePath;
            this.form.patchValue(this.post);
          }
        });
      } else {
        this.mode = 'create';
        this.postId = null;
        this.form.get('image').setValidators(Validators.required);
        this.post = {
          title: '',
          content: '',
          image: null,
          imagePath: '',
          creator: '',
        }
      }
    });
  }

  public initForm(): void {
    this.form = new FormGroup({
      title: new FormControl('', {
        validators: [Validators.required, Validators.minLength(3)]
      }),
      content: new FormControl('', {
        validators: [Validators.required]
      }),
      image: new FormControl('', {
        asyncValidators: [mimeType],
      }),
    })
  }

  public onImagePicked(event: Event): void {
    const file = (event.target as HTMLInputElement).files[0];
    this.form.patchValue({image: file});

    this.form.get('image').updateValueAndValidity();
    const reader = new FileReader();
    reader.onload = () => {
      if (this.form.get('image').errors?.invalidMimeType) {
        this.imagePreview = '';
      } else {
        this.imagePreview = reader.result;
      }
    };
    reader.readAsDataURL(file);
  }

  public onSavePost(): void {
    if (this.form.invalid) {
      return;
    }
    this.isLoading = true;

    const post: PostModel = this.form.value;

    if (this.mode === 'create') {
      this.postsService.addPost(post)
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.router.navigate(['/']);
          },
          error: () => {
            this.isLoading = false;
          },
        });
    } else {
      post._id = this.postId;
      if (!post.image) {
        (post.image as any) = this.imagePreview;
      }
      this.postsService.updatePost(post).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/']);
        },
        error: () => {
          this.isLoading = false;
        }
      });
    }
  }

}
