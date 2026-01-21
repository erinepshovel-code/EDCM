import React, { useState } from "react";
import { 
  Send, 
  Plus, 
  Brain,
  MessageSquarePlus,
  ChevronDown,
  History
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
import { Switch } from "@/components/ui/switch";
import { ConsciousnessField, FieldType } from "@/lib/edcm-data";

interface ConversationInputProps {
  fields: ConsciousnessField[];
  onAddExpression: (text: string, fieldId: string, isReconstruction: boolean) => void;
  onAddField: (f: ConsciousnessField) => void;
}

export function ConversationInput({ 
  fields, 
  onAddExpression,
  onAddField 
}: ConversationInputProps) {
  const [text, setText] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState<string>(fields[0]?.id || "");
  const [isReconstruction, setIsReconstruction] = useState(false);
  
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldType>("other");
  const [newFieldDescriptor, setNewFieldDescriptor] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = () => {
    if (!text.trim() || !selectedFieldId) return;
    onAddExpression(text, selectedFieldId, isReconstruction);
    setText("");
    setIsReconstruction(false);
  };

  const handleCreateField = () => {
    if (!newFieldLabel.trim()) return;
    
    const newId = `f${Date.now()}`;
    const newField: ConsciousnessField = {
      id: newId,
      label: newFieldLabel,
      type: newFieldType,
      descriptor: newFieldDescriptor,
      color: `hsl(${Math.random() * 360} 70% 60%)`
    };
    
    onAddField(newField);
    setSelectedFieldId(newId);
    setNewFieldLabel("");
    setNewFieldDescriptor("");
    setIsDialogOpen(false);
  };

  return (
    <div className="glass-panel p-4 rounded-sm border-t border-border mt-auto">
      <div className="flex flex-col gap-3">
        {/* Controls Row */}
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
              <SelectTrigger className="w-[180px] h-8 text-xs font-mono bg-background/50 border-border/50">
                <SelectValue placeholder="Select Field" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f.id} value={f.id} className="text-xs">
                    <span className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: f.color || "gray" }}
                      />
                      {f.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Define New Field</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="label" className="text-right text-xs uppercase text-muted-foreground">
                      Label
                    </Label>
                    <Input 
                      id="label" 
                      value={newFieldLabel} 
                      onChange={(e) => setNewFieldLabel(e.target.value)}
                      placeholder="e.g., Collective, Field C"
                      className="col-span-3 font-mono" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="descriptor" className="text-right text-xs uppercase text-muted-foreground">
                      Context
                    </Label>
                    <Input 
                      id="descriptor" 
                      value={newFieldDescriptor} 
                      onChange={(e) => setNewFieldDescriptor(e.target.value)}
                      placeholder="Optional descriptor"
                      className="col-span-3 font-mono" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="type" className="text-right text-xs uppercase text-muted-foreground">
                      Type
                    </Label>
                    <Select 
                      value={newFieldType} 
                      onValueChange={(v) => setNewFieldType(v as FieldType)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="self">Self</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="collective">Collective</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                        <SelectItem value="field_a">Field A</SelectItem>
                        <SelectItem value="field_b">Field B</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreateField}>Define Field</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <div className="h-4 w-[1px] bg-border mx-2" />
            
            <div className="flex items-center gap-2">
              <Switch 
                id="reconstruction-mode" 
                checked={isReconstruction}
                onCheckedChange={setIsReconstruction}
                className="scale-75"
              />
              <Label htmlFor="reconstruction-mode" className="text-[10px] text-muted-foreground font-mono uppercase cursor-pointer flex items-center gap-1">
                <History className="h-3 w-3" />
                Memory / Reconstruction
              </Label>
            </div>
          </div>
          
          <div className="text-[10px] font-mono text-muted-foreground hidden sm:block">
            FIELD OBSERVATION ACTIVE
          </div>
        </div>

        {/* Text Input Area */}
        <div className="relative group">
          <Textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Record field expression..."
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
            className="absolute bottom-2 right-2 h-8 w-8 bg-primary hover:bg-primary/90 text-primary-foreground transition-all opacity-80 group-hover:opacity-100"
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
