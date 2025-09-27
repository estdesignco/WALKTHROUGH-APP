
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Mail, Loader2 } from 'lucide-react';
import { SendEmail } from '@/api/integrations';

export default function EmailQuestionnaire({ project }) {
    const [isOpen, setIsOpen] = useState(false);
    const [emailTo, setEmailTo] = useState(project.email || '');
    const [emailSubject, setEmailSubject] = useState(`${project.name} - Project Questionnaire`);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendEmail = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const emailBody = `
                <h2>Project Questionnaire - ${project.name}</h2>
                <p>Dear ${project.client_name},</p>
                
                <p>Thank you for choosing Established Design Co. for your project. Below are the details we have on file:</p>
                
                <h3>Project Information:</h3>
                <ul>
                    <li><strong>Project:</strong> ${project.name}</li>
                    <li><strong>Address:</strong> ${project.address}</li>
                    <li><strong>Type:</strong> ${project.project_type || 'N/A'}</li>
                    <li><strong>Timeline:</strong> ${project.timeline || 'N/A'}</li>
                    <li><strong>Budget:</strong> ${project.budget || 'N/A'}</li>
                    <li><strong>Style:</strong> ${project.style || 'N/A'}</li>
                </ul>
                
                <h3>Rooms Involved:</h3>
                <p>${project.rooms_involved ? project.rooms_involved.join(', ') : 'N/A'}</p>
                
                <h3>Special Requirements:</h3>
                <p>${project.special_requirements || 'None specified'}</p>
                
                <p>Please review this information and let us know if any changes are needed.</p>
                
                <p>Best regards,<br>
                Established Design Co.</p>
            `;

            await SendEmail({
                to: emailTo,
                subject: emailSubject,
                body: emailBody,
                from_name: 'Established Design Co.'
            });

            setIsOpen(false);
            alert('Questionnaire sent successfully!');
        } catch (error) {
            console.error('Failed to send email:', error);
            alert('Failed to send email. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-[#8B7355] text-[#8B7355] hover:bg-[#8B7355] hover:text-stone-200">
                    <Mail className="w-4 h-4 mr-2" />
                    Email Questionnaire
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Email Questionnaire to Client</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSendEmail} className="space-y-4">
                    <div>
                        <Label htmlFor="emailTo">Send to:</Label>
                        <Input
                            id="emailTo"
                            type="email"
                            value={emailTo}
                            onChange={(e) => setEmailTo(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <Label htmlFor="emailSubject">Subject:</Label>
                        <Input
                            id="emailSubject"
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-[#8B7355] hover:bg-[#6B5A44]">
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
                            Send Email
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
