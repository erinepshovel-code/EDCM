import React, { useState } from "react";
import { 
  Send, 
  UserPlus, 
  Users,
  MessageSquarePlus,
  ChevronDown
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Participant, SpeakerRole } from "@/lib/edcm-data";

interface ConversationInputProps {
  participants: Participant[];
  onAddTurn: (text: string, speakerId: string) => void;
  onAddParticipant: (p: Participant) => void;
}

export function ConversationInput({ 
  participants, 
  onAddTurn,
  onAddParticipant 
}: ConversationInputProps) {
  const [text, setText] = useState("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>(participants[0]?.id || "");
  
  const [newParticipantName, setNewParticipantName] = useState("");
  const [newParticipantRole, setNewParticipantRole] = useState<SpeakerRole>("participant");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = () => {
    if (!text.trim() || !selectedSpeakerId) return;
    onAddTurn(text, selectedSpeakerId);
    setText("");
  };

  const handleCreateParticipant = () => {
    if (!newParticipantName.trim()) return;
    
    const newId = `p${Date.now()}`; // simple ID generation
    const newParticipant: Participant = {
      id: newId,
      name: newParticipantName,
      role: newParticipantRole,
      color: `hsl(${Math.random() * 360} 70% 60%)` // random color
    };
    
    onAddParticipant(newParticipant);
    setSelectedSpeakerId(newId); // auto-select new participant
    setNewParticipantName("");
    setIsDialogOpen(false);
  };

  return (
    <div className="glass-panel p-4 rounded-sm border-t border-border mt-auto">
      <div className="flex flex-col gap-3">
        {/* Controls Row */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Select value={selectedSpeakerId} onValueChange={setSelectedSpeakerId}>
              <SelectTrigger className="w-[180px] h-8 text-xs font-mono bg-background/50 border-border/50">
                <SelectValue placeholder="Select Speaker" />
              </SelectTrigger>
              <SelectContent>
                {participants.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: p.color || "gray" }}
                      />
                      {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <UserPlus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Participant</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right text-xs uppercase text-muted-foreground">
                      Name
                    </Label>
                    <Input 
                      id="name" 
                      value={newParticipantName} 
                      onChange={(e) => setNewParticipantName(e.target.value)}
                      className="col-span-3 font-mono" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="role" className="text-right text-xs uppercase text-muted-foreground">
                      Role
                    </Label>
                    <Select 
                      value={newParticipantRole} 
                      onValueChange={(v) => setNewParticipantRole(v as SpeakerRole)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="assistant">Assistant</SelectItem>
                        <SelectItem value="participant">Participant</SelectItem>
                        <SelectItem value="moderator">Moderator</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateParticipant}>Add Participant</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="text-[10px] font-mono text-muted-foreground hidden sm:block">
            EDCM ANALYSIS MODE: ACTIVE
          </div>
        </div>

        {/* Text Input Area */}
        <div className="relative">
          <Textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter conversation turn..."
            className="min-h-[80px] pr-12 font-mono text-sm bg-background/50 border-border/50 resize-none focus-visible:ring-primary/20"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button 
            size="icon" 
            className="absolute bottom-2 right-2 h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground transition-all"
            onClick={handleSubmit}
            disabled={!text.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
