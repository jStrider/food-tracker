import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

describe('Card', () => {
  it('renders basic card correctly', () => {
    render(
      <Card>
        <CardContent>Test Content</CardContent>
      </Card>
    );
    
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders all card components correctly', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test Content</p>
        </CardContent>
        <CardFooter>
          <p>Test Footer</p>
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });

  it('applies custom className to card', () => {
    const { container } = render(
      <Card className="custom-class">
        <CardContent>Content</CardContent>
      </Card>
    );
    
    const card = container.firstChild;
    expect(card).toHaveClass('custom-class');
  });

  it('applies custom className to card header', () => {
    const { container } = render(
      <Card>
        <CardHeader className="custom-header">
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    );
    
    const header = container.querySelector('.custom-header');
    expect(header).toBeInTheDocument();
  });

  it('renders card title as h3 by default', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
      </Card>
    );
    
    const title = screen.getByText('Test Title');
    expect(title.tagName).toBe('H3');
  });

  it('renders card description with correct styling', () => {
    render(
      <Card>
        <CardHeader>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
      </Card>
    );
    
    const description = screen.getByText('Test Description');
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });
});