import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Share2, 
  Facebook, 
  Twitter, 
  MessageCircle,
  Mail,
  Link as LinkIcon
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface ProductShareButtonsProps {
  productName: string;
  productId: string;
  productDescription?: string;
  productImage?: string;
}

const ProductShareButtons: React.FC<ProductShareButtonsProps> = ({
  productName,
  productId,
  productDescription,
  productImage
}) => {
  const { toast } = useToast();
  const productUrl = `${window.location.origin}/produto/${productId}`;
  const shareText = `${productName} - ${productDescription || 'Confira este produto incrível!'}`;

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(productUrl);
    const encodedText = encodeURIComponent(shareText);

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(productName)}&body=${encodedText}%20${encodedUrl}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(productUrl);
        toast({
          title: 'Link copiado!',
          description: 'Link do produto copiado para a área de transferência'
        });
        return;
      case 'native':
        if (navigator.share) {
          try {
            await navigator.share({
              title: productName,
              text: productDescription || '',
              url: productUrl,
              ...(productImage && { files: [] })
            });
            return;
          } catch (error) {
            // Usuário cancelou
            return;
          }
        }
        // Fallback para copiar
        navigator.clipboard.writeText(productUrl);
        toast({
          title: 'Link copiado!',
          description: 'Link do produto copiado para a área de transferência'
        });
        return;
      default:
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" title="Compartilhar">
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {navigator.share && (
          <DropdownMenuItem onClick={() => handleShare('native')}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => handleShare('facebook')}>
          <Facebook className="h-4 w-4 mr-2" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')}>
          <Twitter className="h-4 w-4 mr-2" />
          Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="h-4 w-4 mr-2" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('email')}>
          <Mail className="h-4 w-4 mr-2" />
          E-mail
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')}>
          <LinkIcon className="h-4 w-4 mr-2" />
          Copiar Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProductShareButtons;

