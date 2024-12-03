document.addEventListener('DOMContentLoaded', () => {
    const avatarUpload = document.getElementById('avatarUpload');
    const currentAvatar = document.getElementById('currentAvatar');
    const saveProfile = document.getElementById('saveProfile');
    const toast = document.getElementById('toast');

    avatarUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                currentAvatar.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    saveProfile.addEventListener('click', () => {
        const name = document.getElementById('name').value;
        const bio = document.getElementById('bio').value;
        const github = document.getElementById('github').value;
        const twitter = document.getElementById('twitter').value;
        const about = document.getElementById('about').value;

        const formData = new FormData();
        formData.append('avatar', avatarUpload.files[0]);
        formData.append('name', name);
        formData.append('bio', bio);
        formData.append('github', github);
        formData.append('twitter', twitter);
        formData.append('about', about);

        fetch('/api/profile', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            showToast(data.message);
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('保存失败，请重试');
        });
    });

    function showToast(message) {
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
});
