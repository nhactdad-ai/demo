import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import AdmZip from "adm-zip";

// Core Mock Data directly defined for the server
interface Designer {
  name: string;
  role: string;
}

interface DesignRequest {
  id: string;
  title: string;
  content: string;
  quantity: number;
  status: 'dang_lam' | 'cho_duyet' | 'hoan_thanh' | 'tre_han';
  completionDate: string;
  department: string;
  designer: string;
  priority: 'thap' | 'trung_binh' | 'cao';
  createdAt: string;
}

interface TimelineLog {
  id: string;
  requestId: string;
  requestTitle: string;
  action: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'danger';
}

const INITIAL_DESIGNERS: Designer[] = [
  { name: 'Trần Minh', role: 'Graphic Designer' },
  { name: 'Lê An', role: 'UI/UX Designer' },
  { name: 'Phạm Hùng', role: 'Senior Illustrator' },
  { name: 'Nguyễn Hoa', role: 'Brand Specialist' }
];

const DEPARTMENTS: string[] = [
  'Marketing',
  'Nhân Sự',
  'Sản Phẩm',
  'Đào Tạo',
  'Truyền Thông',
  'Kinh Doanh'
];

const INITIAL_REQUESTS: DesignRequest[] = [
  {
    id: 'req-1',
    title: 'Banner Facebook Q4',
    content: 'Chiến dịch khuyến mãi cuối năm 2024 quảng cáo trên Fanpage Facebook',
    quantity: 5,
    status: 'dang_lam',
    completionDate: '2024-10-24',
    department: 'Marketing',
    designer: 'Trần Minh',
    priority: 'cao',
    createdAt: '2024-10-10T08:00:00Z'
  },
  {
    id: 'req-2',
    title: 'Landing Page Tuyển Dụng',
    content: 'Thiết kế lại giao diện tuyển dụng IT Freshers chất lượng cao',
    quantity: 1,
    status: 'cho_duyet',
    completionDate: '2024-10-26',
    department: 'Nhân Sự',
    designer: 'Lê An',
    priority: 'cao',
    createdAt: '2024-10-12T14:30:00Z'
  },
  {
    id: 'req-3',
    title: 'Bộ Icon Hệ Thống',
    content: '50 icons cho app quản lý kho mới, đồng bộ thương hiệu',
    quantity: 50,
    status: 'hoan_thanh',
    completionDate: '2024-10-20',
    department: 'Sản Phẩm',
    designer: 'Phạm Hùng',
    priority: 'trung_binh',
    createdAt: '2024-10-05T09:00:00Z'
  },
  {
    id: 'req-4',
    title: 'Poster Workshop AI',
    content: 'Sự kiện đào tạo ứng dụng Trí tuệ Nhân tạo nội bộ tháng 11',
    quantity: 2,
    status: 'tre_han',
    completionDate: '2024-10-15',
    department: 'Đào Tạo',
    designer: 'Trần Minh',
    priority: 'cao',
    createdAt: '2024-10-01T10:00:00Z'
  },
  {
    id: 'req-5',
    title: 'Thẻ Nhân Viên Mới',
    content: 'In ấn thẻ danh tính phục vụ đợt tuyển dụng fresher đợt 2',
    quantity: 20,
    status: 'dang_lam',
    completionDate: '2024-10-28',
    department: 'Nhân Sự',
    designer: 'Lê An',
    priority: 'thap',
    createdAt: '2024-10-18T13:15:00Z'
  }
];

const INITIAL_TIMELINE: TimelineLog[] = [
  {
    id: 'log-1',
    requestId: 'req-1',
    requestTitle: 'Banner Facebook Q4',
    action: 'Bắt đầu thiết kế',
    time: '2 giờ trước',
    type: 'info'
  },
  {
    id: 'log-2',
    requestId: 'req-2',
    requestTitle: 'Landing Page Tuyển Dụng',
    action: 'Gửi duyệt bởi Lê An',
    time: '4 giờ trước',
    type: 'warning'
  }
];

const DB_FILE_PATH = path.join(process.cwd(), "database.json");

// Local variable storage holding full db in process
let localDb = {
  requests: INITIAL_REQUESTS,
  logs: INITIAL_TIMELINE,
  designers: INITIAL_DESIGNERS,
  departments: DEPARTMENTS
};

// Help load from file if exists
function loadDbFromFile() {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const content = fs.readFileSync(DB_FILE_PATH, "utf-8");
      if (content.trim()) {
        const parsed = JSON.parse(content);
        localDb = {
          requests: parsed.requests || [],
          logs: parsed.logs || [],
          designers: parsed.designers || [],
          departments: parsed.departments || []
        };
        console.log("Database persistent file loaded successfully from system storage.");
      }
    } else {
      saveDbToFile();
    }
  } catch (err) {
    console.error("Failed to load local DB schema file:", err);
  }
}

// Help write back to file
function saveDbToFile() {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(localDb, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local DB schema to file:", err);
  }
}

// Load DB immediately at setup
loadDbFromFile();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON parsing middleware
  app.use(express.json());

  // GET complete db
  app.get("/api/db", (req, res) => {
    res.json(localDb);
  });

  // POST updates to requests
  app.post("/api/db/requests", (req, res) => {
    try {
      const { data } = req.body;
      if (Array.isArray(data)) {
        localDb.requests = data;
        saveDbToFile();
        res.json({ success: true, count: data.length });
      } else {
        res.status(400).json({ success: false, error: "Dữ liệu gửi lên phải là một danh sách các yêu cầu thiết kế hợp lệ." });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST updates to logs
  app.post("/api/db/logs", (req, res) => {
    try {
      const { data } = req.body;
      if (Array.isArray(data)) {
        localDb.logs = data;
        saveDbToFile();
        res.json({ success: true, count: data.length });
      } else {
        res.status(400).json({ success: false, error: "Dữ liệu gửi lên phải là một danh sách logs hợp lệ." });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST updates to designers
  app.post("/api/db/designers", (req, res) => {
    try {
      const { data } = req.body;
      if (Array.isArray(data)) {
        localDb.designers = data;
        saveDbToFile();
        res.json({ success: true, count: data.length });
      } else {
        res.status(400).json({ success: false, error: "Dữ liệu gửi lên phải là một danh sách thiết kế viên hợp lệ." });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST updates to departments
  app.post("/api/db/departments", (req, res) => {
    try {
      const { data } = req.body;
      if (Array.isArray(data)) {
        localDb.departments = data;
        saveDbToFile();
        res.json({ success: true, count: data.length });
      } else {
        res.status(400).json({ success: false, error: "Dữ liệu gửi lên phải là một danh sách phòng ban hợp lệ." });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST request to reset database with direct parameters
  app.post("/api/db/reset", (req, res) => {
    try {
      localDb = {
        requests: INITIAL_REQUESTS,
        logs: INITIAL_TIMELINE,
        designers: INITIAL_DESIGNERS,
        departments: DEPARTMENTS
      };
      saveDbToFile();
      res.json({ success: true, message: "Cơ sở dữ liệu đã phục hồi mặc định trạng thái thành công" });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Endpoint to package and download code as ZIP file
  app.get("/api/download-zip", (req, res) => {
    try {
      const zip = new AdmZip();
      const workspaceRoot = process.cwd();

      // Folders and files to include
      const itemsToZip = [
        { type: "directory", relativePath: "src" },
        { type: "file", relativePath: "package.json" },
        { type: "file", relativePath: "tsconfig.json" },
        { type: "file", relativePath: "vite.config.ts" },
        { type: "file", relativePath: "index.html" },
        { type: "file", relativePath: "metadata.json" },
        { type: "file", relativePath: ".gitignore" },
        { type: "file", relativePath: ".env.example" },
        { type: "file", relativePath: "server.ts" }
      ];

      for (const item of itemsToZip) {
        const fullPath = path.join(workspaceRoot, item.relativePath);
        if (fs.existsSync(fullPath)) {
          if (item.type === "directory") {
            zip.addLocalFolder(fullPath, item.relativePath);
          } else {
            zip.addLocalFile(fullPath, "", item.relativePath);
          }
        }
      }

      const zipBuffer = zip.toBuffer();

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=thiet_ke_theo_yeu_cau_source_code.zip"
      );
      res.send(zipBuffer);
    } catch (err) {
      console.error("Lỗi khi nén mã nguồn thành file ZIP:", err);
      res.status(500).json({
        success: false,
        error: "Không thể tạo file ZIP cho mã nguồn. Vui lòng thử lại sau."
      });
    }
  });

  // Hotfix sync state healthcheck or metadata config
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
