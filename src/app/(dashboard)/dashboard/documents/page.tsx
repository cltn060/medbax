export default function DocumentsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Medical Documents</h1>
            <p className="text-gray-500">Upload past medical records to enhance your AI companion's context.</p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary cursor-pointer transition-colors bg-gray-50">
                <p className="text-gray-600">Drag and drop files here, or click to browse</p>
                <button className="mt-4 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Upload Document
                </button>
            </div>

            <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">Recent Uploads</h3>
                <p className="text-sm text-gray-500">No documents uploaded yet.</p>
            </div>
        </div>
    );
}
