from django.shortcuts import render, get_object_or_404
from django.core.paginator import Paginator, EmptyPage,\
                                  PageNotAnInteger
from .models import Post
from django.views.generic import ListView
from .forms import EmailPostForm
def post_share(request, post_id):
    # Retrieve post by id
    post = get_object_or_404(Post, id=post_id, status='published')
    if request.method == 'POST':
        # Form was submitted
        form = EmailPostForm(request.POST)
        if form.is_valid():
            # Form fields passed validation
            cd = form.cleaned_data
            # ... send email
    else:
        form = EmailPostForm()
    return render(request, 'blog/post/share.html', {'post': post,
                                                    'form': form})

class PostListView(ListView):
    queryset = Post.published.all()
    context_object_name = 'posts'
    paginate_by = 3
    template_name = 'blog/post/list.html'

#def post_list(request):
#    object_list = Post.published.all()
#    paginator = Paginator(object_list, 3) # 3 posts in each page
#    page = request.GET.get('page')
#    try:
#        posts = paginator.page(page)
#    except PageNotAnInteger:
#        # If page is not an integer deliver the first page
#        posts = paginator.page(1)
#    except EmptyPage:
#        # If page is out of range deliver last page of results
#        posts = paginator.page(paginator.num_pages)
#    posts = Post.published.all()
#    return render(request,
#                 'blog/post/list.html',
#                 {'page': page,
#                 'posts': posts})

def post_detail(request, year, month, day, post):
    post = get_object_or_404(Post, slug=post,
                                   status='published',
                                   publish__year=year,
                                   publish__month=month,
                                   publish__day=day)
    return render(request,
                  'blog/post/detail.html',
                  {'post': post})
