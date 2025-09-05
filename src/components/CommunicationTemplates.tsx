
import { useState } from 'react';
import { MessageCircle, Mail, Copy, Send, Eye } from 'lucide-react';
import { useCommunicationTemplates } from '@/hooks/useCommunicationTemplates';
import { useOptimizedProperties } from '@/hooks/useOptimizedProperties';
import { Booking } from '@/types/booking';
import { Property } from '@/types/property';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from 'sonner';

interface CommunicationTemplatesProps {
  booking: Booking;
}

export const CommunicationTemplates = ({ booking }: CommunicationTemplatesProps) => {
  const {
    templates,
    getTemplatesByCategory,
    generateMessage,
    openWhatsApp,
    generateEmailLink
  } = useCommunicationTemplates();
  
  const { properties } = useOptimizedProperties();

  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [customVariables, setCustomVariables] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | undefined>(() => {
    // Se a reserva tem property_id, tentar encontrar a propriedade correspondente
    if (booking.property_id && properties.length > 0) {
      return properties.find(p => p.id === booking.property_id);
    }
    return undefined;
  });

  const categories = [
    { key: 'confirmation', label: 'Confirmação', color: 'bg-green-100 text-green-700' },
    { key: 'reminder', label: 'Lembretes', color: 'bg-blue-100 text-blue-700' },
    { key: 'checkin', label: 'Check-in', color: 'bg-purple-100 text-purple-700' },
    { key: 'checkout', label: 'Check-out', color: 'bg-orange-100 text-orange-700' },
    { key: 'payment', label: 'Pagamento', color: 'bg-yellow-100 text-yellow-700' },
    { key: 'cancellation', label: 'Cancelamento', color: 'bg-red-100 text-red-700' }
  ];

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const result = generateMessage(templateId, booking, customVariables, selectedProperty);
    if (typeof result === 'object' && result.message) {
      setCustomMessage(result.message);
    }
  };

  const handlePropertyChange = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property);
    
    // Regenerar mensagem se já houver uma selecionada
    if (selectedTemplate) {
      const result = generateMessage(selectedTemplate, booking, customVariables, property);
      if (typeof result === 'object' && result.message) {
        setCustomMessage(result.message);
      }
    }
  };

  const handleSendWhatsApp = () => {
    if (!booking.phone) {
      toast.error('Telefone não informado');
      return;
    }
    
    openWhatsApp(booking.phone, customMessage);
    toast.success('WhatsApp aberto');
  };

  const handleSendEmail = () => {
    if (!booking.email) {
      toast.error('Email não informado');
      return;
    }

    const template = templates.find(t => t.id === selectedTemplate);
    const result = generateMessage(selectedTemplate, booking, customVariables, selectedProperty);
    const subject = template?.subject && typeof result === 'object' && result.subject ?
      result.subject : 
      'Reserva';
    
    const emailLink = generateEmailLink(booking.email, subject, customMessage);
    window.open(emailLink);
    toast.success('Email aberto');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customMessage);
    toast.success('Mensagem copiada');
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <h3 className="font-semibold text-sage-800 mb-4">Templates de Comunicação</h3>
      
      {/* Categorias */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {categories.map(category => {
          const categoryTemplates = getTemplatesByCategory(category.key as any);
          return (
            <Dialog key={category.key}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className={`h-auto p-3 flex flex-col items-start ${category.color} border-current/20`}
                >
                  <span className="font-medium text-sm">{category.label}</span>
                  <span className="text-xs opacity-75">
                    {categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''}
                  </span>
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Templates - {category.label}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  {categoryTemplates.map(template => (
                    <div key={template.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{template.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {template.type === 'whatsapp' ? (
                              <><MessageCircle size={12} className="mr-1" /> WhatsApp</>
                            ) : (
                              <><Mail size={12} className="mr-1" /> Email</>
                            )}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              handleTemplateSelect(template.id);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye size={14} className="mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded max-h-32 overflow-y-auto">
                        {template.message.split('\n').slice(0, 3).join('\n')}
                        {template.message.split('\n').length > 3 && '...'}
                      </div>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          );
        })}
      </div>

      {/* Preview e Edição */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview e Edição da Mensagem</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Seleção de Propriedade */}
            <div>
              <Label htmlFor="property_select">Selecionar Chalé</Label>
              <Select
                value={selectedProperty?.id || ''}
                onValueChange={handlePropertyChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o chalé" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variáveis Customizáveis */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="endereco">Endereço do Chalé</Label>
                <Input
                  id="endereco"
                  placeholder="Rua exemplo, 123"
                  value={customVariables.endereco || ''}
                  onChange={(e) => setCustomVariables(prev => ({
                    ...prev,
                    endereco: e.target.value
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="codigo_portao">Código do Portão</Label>
                <Input
                  id="codigo_portao"
                  placeholder="1234"
                  value={customVariables.codigo_portao || ''}
                  onChange={(e) => setCustomVariables(prev => ({
                    ...prev,
                    codigo_portao: e.target.value
                  }))}
                />
              </div>
            </div>

            {/* Mensagem Editável */}
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={12}
                className="font-mono text-sm"
              />
            </div>

            {/* Ações */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={handleCopyMessage}
              >
                <Copy size={14} className="mr-1" />
                Copiar
              </Button>
              
              {booking.phone && (
                <Button
                  onClick={handleSendWhatsApp}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle size={14} className="mr-1" />
                  WhatsApp
                </Button>
              )}
              
              {booking.email && (
                <Button
                  onClick={handleSendEmail}
                  variant="outline"
                >
                  <Mail size={14} className="mr-1" />
                  Email
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
