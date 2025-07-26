const express = require('express');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const app = express();
const PORT = process.env.PORT || 3000;

// 미리 보기가 가능한 MIME 타입 정의 (클라이언트에서도 동일하게 사용될 수 있습니다)
const VIEWABLE_MIMES = {
    'application/pdf': true,
    'video/mp4': true,
    'video/webm': true,
    'video/ogg': true,
    'audio/mpeg': true,
    'audio/wav': true,
    'audio/ogg': true,
    'image/jpeg': true,
    'image/png': true,
    'image/gif': true,
    'image/svg+xml': true
};

// --- Middleware ---
// 'public' 디렉토리에서 정적 파일 (index.html 포함) 제공
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Routes ---

// 1. 파일 목록을 JSON 형태로 제공하는 API 엔드포인트
app.get('/api/files', (req, res) => {
    const uploadsDir = path.join(__dirname, 'uploads');

    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir);
    }

    fs.readdir(uploadsDir, (err, files) => {
        if (err) {
            console.error('Error reading uploads directory:', err);
            return res.status(500).json({ error: '파일 목록을 읽어오는 중 오류 발생.' });
        }

        const fileDetails = files
            .filter(file => fs.statSync(path.join(uploadsDir, file)).isFile())
            .map(file => {
                const filePath = path.join(uploadsDir, file);
                const fileMimeType = mime.lookup(filePath) || 'unknown/unknown';
                return {
                    name: file,
                    mimeType: fileMimeType,
                    isViewable: VIEWABLE_MIMES[fileMimeType] // 클라이언트에서 사용하도록 전달
                };
            });

        res.json(fileDetails); // JSON 형태로 파일 목록 반환
    });
});

// 2. 파일 미리 보기 라우트 (변경 없음)
app.get('/view/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`File not found for viewing: ${filename}`, err);
            return res.status(404).send('파일을 찾을 수 없습니다.');
        }

        const fileMimeType = mime.lookup(filePath);

        if (fileMimeType && VIEWABLE_MIMES[fileMimeType]) {
            res.setHeader('Content-Type', fileMimeType);
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.status(400).send('이 파일 형식은 웹에서 직접 미리 볼 수 없습니다. 다운로드해야 합니다.');
        }
    });
});

// 3. 파일 다운로드 라우트 (변경 없음)
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`File not found for download: ${filename}`, err);
            return res.status(404).send('파일을 찾을 수 없습니다.');
        }

        res.download(filePath, (downloadErr) => {
            if (downloadErr) {
                console.error(`Error downloading file ${filename}:`, downloadErr);
                if (!res.headersSent) {
                    res.status(500).send('파일 다운로드 중 오류 발생.');
                }
            }
        });
    });
});

// 4. 파일 삭제 라우트 (변경 없음)
app.delete('/api/delete/:filename', (req, res) => { // DELETE 요청으로 변경
    const filename = req.params.filename;
    const filePath = path.join(__dirname, 'uploads', filename);

    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Error deleting file ${filename}:`, err);
            return res.status(500).json({ success: false, message: '파일 삭제 중 오류 발생.' });
        }
        console.log(`File deleted: ${filename}`);
        res.json({ success: true, message: '파일이 성공적으로 삭제되었습니다.' });
    });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    console.log('파일은 "uploads" 디렉토리에 있어야 합니다.');
});