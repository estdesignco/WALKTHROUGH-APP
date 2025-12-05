import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { CheckCircle, AlertCircle, Upload, Download, Eye, FileSpreadsheet } from 'lucide-react';

const GoogleSheetsImporter = () => {
    const [sheetsUrl, setSheetsUrl] = useState('');
    const [previewData, setPreviewData] = useState(null);
    const [importResult, setImportResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mappingInfo, setMappingInfo] = useState(null);

    // Load mapping information on component mount
    React.useEffect(() => {
        fetchMappingInfo();
    }, []);

    const fetchMappingInfo = async () => {
        try {
            const response = await fetch('/api/google-sheets/mapping-info');
            const data = await response.json();
            setMappingInfo(data);
        } catch (err) {
            console.error('Failed to load mapping info:', err);
        }
    };

    const handlePreview = async () => {
        if (!sheetsUrl.trim()) {
            setError('Please enter a Google Sheets URL');
            return;
        }

        setLoading(true);
        setError('');
        setPreviewData(null);

        try {
            const response = await fetch('/api/google-sheets/preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: sheetsUrl,
                    start_row: 1
                })
            });

            const data = await response.json();

            if (data.success) {
                setPreviewData(data);
            } else {
                setError(data.message || 'Preview failed');
            }
        } catch (err) {
            setError(`Preview failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async () => {
        if (!previewData) {
            setError('Please preview the data first');
            return;
        }

        setLoading(true);
        setError('');
        setImportResult(null);

        try {
            const response = await fetch('/api/google-sheets/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: sheetsUrl,
                    start_row: 1,
                    create_projects: true,
                    project_prefix: ''
                })
            });

            const data = await response.json();

            if (data.success) {
                setImportResult(data);
                setPreviewData(null); // Clear preview after successful import
            } else {
                setError(data.message || 'Import failed');
            }
        } catch (err) {
            setError(`Import failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClearImported = async () => {
        if (!window.confirm('Are you sure you want to delete ALL imported projects? This cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/google-sheets/clear-imported', {
                method: 'DELETE'
            });

            const data = await response.json();
            if (data.success) {
                alert(`Successfully deleted ${data.deleted_count} imported projects`);
                setImportResult(null);
                setPreviewData(null);
            } else {
                setError('Failed to clear imported projects');
            }
        } catch (err) {
            setError(`Clear failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                    <FileSpreadsheet className="inline-block mr-2 mb-1" />
                    Google Sheets Import
                </h1>
                <p className="text-gray-600">Import client questionnaires directly from Google Sheets into your Interior Design projects</p>
            </div>

            <Tabs defaultValue="import" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="import">Import Data</TabsTrigger>
                    <TabsTrigger value="mappings">Column Mappings</TabsTrigger>
                </TabsList>

                <TabsContent value="import" className="space-y-6">
                    {/* URL Input Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Upload className="mr-2" />
                                Import Google Sheets
                            </CardTitle>
                            <CardDescription>
                                Paste your Google Sheets URL to import client questionnaire data
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="sheets-url">Google Sheets URL</Label>
                                <Input
                                    id="sheets-url"
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                    value={sheetsUrl}
                                    onChange={(e) => setSheetsUrl(e.target.value)}
                                    className="font-mono text-sm"
                                />
                                <p className="text-sm text-gray-500">
                                    Make sure your Google Sheet is shared publicly or with "Anyone with the link can view"
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <Button 
                                    onClick={handlePreview} 
                                    disabled={loading || !sheetsUrl.trim()}
                                    className="flex items-center"
                                >
                                    <Eye className="mr-2 h-4 w-4" />
                                    {loading ? 'Loading...' : 'Preview Data'}
                                </Button>

                                {previewData && (
                                    <Button 
                                        onClick={handleImport} 
                                        disabled={loading}
                                        className="flex items-center bg-green-600 hover:bg-green-700"
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Import {previewData.total_rows} Projects
                                    </Button>
                                )}

                                <Button 
                                    onClick={handleClearImported} 
                                    variant="outline"
                                    className="flex items-center text-red-600 border-red-600 hover:bg-red-50"
                                >
                                    Clear Imported (Testing)
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Error Display */}
                    {error && (
                        <Alert className="border-red-200 bg-red-50">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Preview Results */}
                    {previewData && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Eye className="mr-2" />
                                    Import Preview
                                </CardTitle>
                                <CardDescription>
                                    Review the data before importing into your Interior Design system
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">{previewData.total_rows}</div>
                                        <div className="text-sm text-gray-600">Projects Found</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{previewData.sample_projects.length}</div>
                                        <div className="text-sm text-gray-600">Sample Shown</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-orange-600">{previewData.errors.length}</div>
                                        <div className="text-sm text-gray-600">Warnings</div>
                                    </div>
                                </div>

                                {previewData.sample_projects.length > 0 && (
                                    <div className="space-y-4">
                                        <h4 className="font-semibold">Sample Projects:</h4>
                                        {previewData.sample_projects.map((project, index) => (
                                            <div key={index} className="border rounded-lg p-4 bg-white">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <h5 className="font-semibold">{project.name}</h5>
                                                        <p className="text-sm text-gray-600">
                                                            Client: {project.client_info?.full_name}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Email: {project.client_info?.email}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Type: <Badge variant="outline">{project.project_type}</Badge>
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium">Rooms:</p>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {project.rooms_involved?.slice(0, 5).map((room, i) => (
                                                                <Badge key={i} variant="secondary" className="text-xs">
                                                                    {room}
                                                                </Badge>
                                                            ))}
                                                            {project.rooms_involved?.length > 5 && (
                                                                <Badge variant="secondary" className="text-xs">
                                                                    +{project.rooms_involved.length - 5} more
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            Timeline: {project.timeline || 'Not specified'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {previewData.errors.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-orange-600">Warnings:</h4>
                                        <div className="bg-orange-50 p-3 rounded border">
                                            {previewData.errors.map((error, index) => (
                                                <p key={index} className="text-sm text-orange-800">{error}</p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Import Success Results */}
                    {importResult && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center text-green-600">
                                    <CheckCircle className="mr-2" />
                                    Import Completed Successfully!
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <p className="text-green-800 font-semibold">
                                        {importResult.message}
                                    </p>
                                    <p className="text-sm text-green-700">
                                        Created {importResult.projects_created} new Interior Design projects with all client questionnaire data
                                    </p>
                                </div>

                                {importResult.project_ids.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold mb-2">Created Project IDs:</h4>
                                        <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                                            {importResult.project_ids.map((id, index) => (
                                                <div key={index} className="mb-1">{id}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {importResult.errors.length > 0 && (
                                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                                        <h4 className="font-semibold text-yellow-800 mb-2">Notes:</h4>
                                        {importResult.errors.map((error, index) => (
                                            <p key={index} className="text-sm text-yellow-700">{error}</p>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="mappings" className="space-y-6">
                    {mappingInfo && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Supported Column Mappings</CardTitle>
                                <CardDescription>
                                    Your Google Sheets columns will be automatically mapped to Interior Design system fields
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="font-semibold text-blue-800">
                                        {mappingInfo.total_columns_supported} questionnaire columns supported
                                    </p>
                                    <p className="text-sm text-blue-700">
                                        All client questionnaire data will be preserved and imported into your Interior Design projects
                                    </p>
                                </div>

                                {Object.entries(mappingInfo.sample_mappings).map(([category, mappings]) => (
                                    <div key={category}>
                                        <h4 className="font-semibold text-gray-800 mb-3">{category}</h4>
                                        <div className="grid gap-2">
                                            {Object.entries(mappings).map(([column, description]) => (
                                                <div key={column} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                                    <span className="font-mono text-sm text-gray-700">{column}</span>
                                                    <span className="text-sm text-gray-600">{description}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <Separator className="my-4" />
                                    </div>
                                ))}

                                <div className="space-y-2">
                                    <h4 className="font-semibold">Import Notes:</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                                        {mappingInfo.notes.map((note, index) => (
                                            <li key={index}>{note}</li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default GoogleSheetsImporter;